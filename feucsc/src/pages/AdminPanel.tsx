import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  FormControlLabel,
  Button,
  InputAdornment,
  Grid,
  Snackbar,
  Alert,
  FormHelperText,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { Transaction } from "../lib/transactions";
import { addTransaction } from "../lib/transactionsService";
import { getDb, getStorageInstance, getAuthInstance } from "../lib/firebase";
import { type Timestamp } from "firebase/firestore";

import TransactionTable from "../components/admin/TransactionTable";
import EditableTableRow from "../components/admin/EditableTableRow";
import ConfirmationDialog from "../components/admin/ConfirmationDialog";
import { type ColumnConfig } from "../components/admin/TransactionTable";

type SortConfig = {
  column: keyof Transaction | "";
  direction: "asc" | "desc";
};

const columnsConfig: ColumnConfig[] = [
  { id: "date", label: "Fecha", sortable: true, minWidth: 110 },
  { id: "receiptNumber", label: "N° Comp.", sortable: true, minWidth: 80 },
  { id: "description", label: "Descripción", sortable: true, minWidth: 200 },
  {
    id: "amount",
    label: "Importe",
    sortable: true,
    minWidth: 100,
    align: "right",
  },
  {
    id: "receiptUrl",
    label: "Comprobante",
    sortable: false,
    minWidth: 100,
  },
  {
    id: "actions",
    label: "Acciones",
    sortable: false,
    minWidth: 100,
    align: "right",
  },
];

const extractReceiptNumberValue = (
  receiptString: string | undefined | null,
): number => {
  if (!receiptString || !receiptString.startsWith("N°")) {
    return 0;
  }
  const numberPart = receiptString.substring(2);
  const parsedNumber = parseInt(numberPart, 10);
  return isNaN(parsedNumber) ? 0 : parsedNumber;
};

const AdminPanel: React.FC = () => {
  const [type, setType] = useState<"" | "ingreso" | "egreso">("");
  const [year, setYear] = useState<string>(new Date().getFullYear().toString());
  const [month, setMonth] = useState<string>(
    (new Date().getMonth() + 1).toString().padStart(2, "0"),
  );
  const [day, setDay] = useState<string>(
    new Date().getDate().toString().padStart(2, "0"),
  );
  const [isApproximate, setIsApproximate] = useState<boolean>(false);
  const [description, setDescription] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>(
    "Ningún archivo seleccionado",
  );

  const [typeError, setTypeError] = useState<boolean>(false);
  const [descriptionError, setDescriptionError] = useState<boolean>(false);
  const [amountError, setAmountError] = useState<string | false>(false);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [ingresos, setIngresos] = useState<Transaction[]>([]);
  const [egresos, setEgresos] = useState<Transaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState<boolean>(true);
  const [errorTransactions, setErrorTransactions] = useState<string | null>(
    null,
  );

  const [searchIngresos, setSearchIngresos] = useState<string>("");
  const [searchEgresos, setSearchEgresos] = useState<string>("");

  const initialSort: SortConfig = { column: "date", direction: "desc" };
  const [sortIngresos, setSortIngresos] = useState<SortConfig>(initialSort);
  const [sortEgresos, setSortEgresos] = useState<SortConfig>(initialSort);

  const [pageIngresos, setPageIngresos] = useState<number>(0);
  const [rowsPerPageIngresos, setRowsPerPageIngresos] = useState<number>(10);
  const [pageEgresos, setPageEgresos] = useState<number>(0);
  const [rowsPerPageEgresos, setRowsPerPageEgresos] = useState<number>(10);

  const [editingRowId, setEditingRowId] = useState<string | null>(null);

  const [deletingTransaction, setDeletingTransaction] =
    useState<Transaction | null>(null);

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({ open: false, message: "", severity: "success" });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setReceiptFile(event.target.files[0]);
      setFileName(event.target.files[0].name);
    } else {
      setReceiptFile(null);
      setFileName("Ningún archivo seleccionado");
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setTypeError(false);
    setDescriptionError(false);
    setAmountError(false);

    let hasError = false;

    if (!type) {
      setTypeError(true);
      hasError = true;
    }
    if (!description.trim()) {
      setDescriptionError(true);
      hasError = true;
    }
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setAmountError("El importe debe ser un número positivo.");
      hasError = true;
    }

    if (hasError) {
      setSnackbar({
        open: true,
        message: "Por favor, corrige los campos marcados.",
        severity: "error",
      });
      return;
    }

    const auth = await getAuthInstance();
    const currentUser = auth.currentUser;
    if (!currentUser || !currentUser.email) {
      setSnackbar({
        open: true,
        message: "Error: No se pudo verificar el usuario administrador.",
        severity: "error",
      });
      return;
    }

    let transactionDate: Timestamp;
    try {
      const { Timestamp: FirebaseTimestamp } = await import(
        "firebase/firestore"
      );
      const dayToUse = isApproximate ? 1 : parseInt(day, 10);
      const dateObj = new Date(
        parseInt(year, 10),
        parseInt(month, 10) - 1,
        dayToUse,
      );
      if (isNaN(dateObj.getTime())) {
        throw new Error("Fecha inválida seleccionada.");
      }
      transactionDate = FirebaseTimestamp.fromDate(dateObj);
    } catch (dateError: any) {
      setSnackbar({
        open: true,
        message: dateError.message || "Error al construir la fecha.",
        severity: "error",
      });
      return;
    }

    setIsSubmitting(true);
    setSnackbar({ open: false, message: "", severity: "success" });

    const validType = type as "ingreso" | "egreso";

    try {
      const newTransactionId = await addTransaction({
        type: validType,
        date: transactionDate,
        description,
        amount: numericAmount,
        isApproximate,
        receiptFile,
        addedByEmail: currentUser.email,
      });

      setSnackbar({
        open: true,
        message: `Movimiento ${newTransactionId} agregado con éxito.`,
        severity: "success",
      });

      setType("");
      setYear(new Date().getFullYear().toString());
      setMonth((new Date().getMonth() + 1).toString().padStart(2, "0"));
      setDay(new Date().getDate().toString().padStart(2, "0"));
      setIsApproximate(false);
      setDescription("");
      setAmount("");
      setReceiptFile(null);
      setFileName("Ningún archivo seleccionado");
      const fileInput = (event.target as HTMLFormElement).querySelector(
        'input[type="file"]',
      ) as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    } catch (error: any) {
      console.error("Error en handleSubmit:", error);
      setSnackbar({
        open: true,
        message: error.message || "Error al agregar el movimiento.",
        severity: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 2 }, (_, i) =>
    (currentYear - i).toString(),
  );
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: (i + 1).toString().padStart(2, "0"),
    label: new Date(0, i)
      .toLocaleString("es-CL", { month: "long" })
      .replace(/^\w/, (c) => c.toUpperCase()),
  }));
  const days = Array.from({ length: 31 }, (_, i) =>
    (i + 1).toString().padStart(2, "0"),
  );

  const inputStyles = {
    backgroundColor: "#2a2a2a",
    borderRadius: "4px",
    input: { color: "white" },
    label: { color: "grey.500" },
    "& .MuiOutlinedInput-root": {
      "& fieldset": { borderColor: "#444" },
      "&:hover fieldset": { borderColor: "#666" },
      "&.Mui-focused fieldset": { borderColor: "#4ade80" },
      "& .MuiSelect-icon": { color: "grey.500" },
      color: "white",
    },
    "& .MuiInputLabel-root:not(.Mui-focused):not(.MuiFormLabel-filled)": {
      color: "grey.500",
    },
    "& .MuiInputLabel-root.Mui-focused": {
      color: "#4ade80",
    },
  };

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const loadAndSubscribe = async () => {
      setLoadingTransactions(true);
      setErrorTransactions(null);
      try {
        const firestoreDb = await getDb();
        const { collection, query, orderBy, onSnapshot } = await import(
          "firebase/firestore"
        );

        const q = query(
          collection(firestoreDb, "transactions"),
          orderBy("date", "desc"),
        );

        unsubscribe = onSnapshot(
          q,
          (querySnapshot) => {
            const allTransactions: Transaction[] = [];
            querySnapshot.forEach((doc) => {
              const data = doc.data();
              if (data.type && data.date) {
                allTransactions.push({ id: doc.id, ...data } as Transaction);
              }
            });

            setIngresos(allTransactions.filter((t) => t.type === "ingreso"));
            setEgresos(allTransactions.filter((t) => t.type === "egreso"));
            setLoadingTransactions(false);
          },
          (error) => {
            console.error("Error al obtener transacciones: ", error);
            setErrorTransactions(
              "Error al cargar las transacciones. Intenta recargar.",
            );
            setLoadingTransactions(false);
          },
        );
      } catch (error) {
        console.error("Error al configurar la suscripción: ", error);
        setErrorTransactions(
          "Error al cargar las transacciones. Intenta recargar.",
        );
        setLoadingTransactions(false);
      }
    };

    loadAndSubscribe();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const processData = (
    data: Transaction[],
    searchTerm: string,
    sortConfig: SortConfig,
    page: number,
    rowsPerPage: number,
  ) => {
    const filtered = data.filter(
      (item) =>
        item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.receiptNumber?.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    const sorted = [...filtered].sort((a, b) => {
      const col = sortConfig.column;
      if (!col) return 0;

      let valA: any;
      let valB: any;

      if (col === "date") {
        valA = a.date?.toMillis() ?? 0;
        valB = b.date?.toMillis() ?? 0;
      } else if (col === "amount") {
        valA = a.amount ?? 0;
        valB = b.amount ?? 0;
      } else if (col === "receiptNumber") {
        valA = extractReceiptNumberValue(a.receiptNumber);
        valB = extractReceiptNumberValue(b.receiptNumber);
      } else {
        valA = String(a[col as keyof Transaction] ?? "").toLowerCase();
        valB = String(b[col as keyof Transaction] ?? "").toLowerCase();
      }

      let comparison = 0;
      if (valA > valB) comparison = 1;
      else if (valA < valB) comparison = -1;

      return sortConfig.direction === "desc" ? comparison * -1 : comparison;
    });

    const paginated = sorted.slice(
      page * rowsPerPage,
      page * rowsPerPage + rowsPerPage,
    );

    return { processedData: paginated, totalCount: filtered.length };
  };

  const { processedData: processedIngresos, totalCount: totalIngresos } =
    useMemo(
      () =>
        processData(
          ingresos,
          searchIngresos,
          sortIngresos,
          pageIngresos,
          rowsPerPageIngresos,
        ),
      [
        ingresos,
        searchIngresos,
        sortIngresos,
        pageIngresos,
        rowsPerPageIngresos,
      ],
    );

  const { processedData: processedEgresos, totalCount: totalEgresos } = useMemo(
    () =>
      processData(
        egresos,
        searchEgresos,
        sortEgresos,
        pageEgresos,
        rowsPerPageEgresos,
      ),
    [egresos, searchEgresos, sortEgresos, pageEgresos, rowsPerPageEgresos],
  );

  const handleSearchChange = (type: "ingreso" | "egreso", value: string) => {
    if (type === "ingreso") {
      setSearchIngresos(value);
      setPageIngresos(0);
    } else {
      setSearchEgresos(value);
      setPageEgresos(0);
    }
  };

  const handleSortRequest = (
    type: "ingreso" | "egreso",
    column: keyof Transaction | "",
  ) => {
    const isAsc =
      (type === "ingreso" ? sortIngresos.column : sortEgresos.column) ===
        column &&
      (type === "ingreso" ? sortIngresos.direction : sortEgresos.direction) ===
        "asc";
    const direction = isAsc ? "desc" : "asc";
    const newSort: SortConfig = { column, direction };
    if (type === "ingreso") {
      setSortIngresos(newSort);
    } else {
      setSortEgresos(newSort);
    }
  };

  const handleChangePage = (type: "ingreso" | "egreso", newPage: number) => {
    if (type === "ingreso") setPageIngresos(newPage);
    else setPageEgresos(newPage);
  };

  const handleChangeRowsPerPage = (
    type: "ingreso" | "egreso",
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const value = parseInt(event.target.value, 10);
    if (type === "ingreso") {
      setRowsPerPageIngresos(value);
      setPageIngresos(0);
    } else {
      setRowsPerPageEgresos(value);
      setPageEgresos(0);
    }
  };

  const handleEdit = (id: string) => {
    setEditingRowId(id);
  };

  const handleCancelEdit = () => {
    setEditingRowId(null);
  };

  const handleSave = async (
    id: string,
    updatedData: Partial<Transaction>,
    newFile?: File | null,
  ) => {
    const originalTransaction = [...ingresos, ...egresos].find(
      (t) => t.id === id,
    );
    const originalReceiptUrl = originalTransaction?.receiptUrl;

    try {
      let finalUpdateData = { ...updatedData };
      let newReceiptUrl: string | null = null;

      if (newFile) {
        const storage = await getStorageInstance();
        const { ref, uploadBytesResumable, getDownloadURL } = await import(
          "firebase/storage"
        );

        const timestamp = Date.now();
        const storagePath = `${id}-${timestamp}-${newFile.name}`;
        const storageRef = ref(storage, storagePath);

        const uploadTask = uploadBytesResumable(storageRef, newFile);

        await new Promise<void>((resolve, reject) => {
          uploadTask.on(
            "state_changed",
            (snapshot) => {
              const progress =
                (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              console.log("Upload is " + progress + "% done");
            },
            (error) => {
              console.error("Error en subida:", error);
              reject(new Error(`Error al subir archivo: ${error.code}`));
            },
            async () => {
              try {
                newReceiptUrl = await getDownloadURL(uploadTask.snapshot.ref);
                finalUpdateData.receiptUrl = newReceiptUrl;
                resolve();
              } catch (getUrlError) {
                console.error("Error obteniendo URL de descarga:", getUrlError);
                reject(new Error(`Error al obtener URL: ${getUrlError}`));
              }
            },
          );
        });
      }

      const firestoreDb = await getDb();
      const { doc, updateDoc } = await import("firebase/firestore");

      const docRef = doc(firestoreDb, "transactions", id);
      await updateDoc(docRef, finalUpdateData);

      if (
        newFile &&
        originalReceiptUrl &&
        originalReceiptUrl !== "#" &&
        originalReceiptUrl !== newReceiptUrl
      ) {
        try {
          if (originalReceiptUrl.includes("firebasestorage.googleapis.com")) {
            const storage = await getStorageInstance();
            const { ref: storageRefForDelete, deleteObject } = await import(
              "firebase/storage"
            );
            const oldFileRef = storageRefForDelete(storage, originalReceiptUrl);
            await deleteObject(oldFileRef);
          } else {
            console.warn(
              "No se pudo borrar el archivo antiguo, URL no parece ser de Firebase Storage:",
              originalReceiptUrl,
            );
          }
        } catch (deleteError: any) {
          console.error(
            `Error al borrar archivo antiguo (${originalReceiptUrl}):`,
            deleteError,
          );
        }
      }

      setEditingRowId(null);
      setSnackbar({
        open: true,
        message: "Movimiento actualizado con éxito",
        severity: "success",
      });
    } catch (error: any) {
      console.error("Error guardando cambios para ID", id, error);
      setSnackbar({
        open: true,
        message: `Error al guardar: ${error.message || "Ocurrió un problema"}`,
        severity: "error",
      });
      throw error;
    }
  };

  const handleDeleteRequest = (transaction: Transaction) => {
    setDeletingTransaction(transaction);
  };

  const handleCloseConfirmDialog = () => {
    setDeletingTransaction(null);
  };

  const handleConfirmDelete = async () => {
    if (!deletingTransaction) return;
    const idToDelete = deletingTransaction.id;
    setDeletingTransaction(null);
    try {
      const firestoreDb = await getDb();
      const { doc, deleteDoc } = await import("firebase/firestore");

      await deleteDoc(doc(firestoreDb, "transactions", idToDelete));
      setSnackbar({
        open: true,
        message: "Movimiento eliminado",
        severity: "success",
      });
    } catch (error) {
      console.error("Error eliminando:", error);
      setSnackbar({
        open: true,
        message: "Error al eliminar el movimiento",
        severity: "error",
      });
    }
  };

  const handleExport = (type: "ingreso" | "egreso") => {
    const dataToExport =
      type === "ingreso" ? processedIngresos : processedEgresos;
    const filename = `Reporte_${type}s_FEUCSC_${new Date().toISOString().slice(0, 10)}.csv`;

    if (dataToExport.length === 0) {
      alert("No hay datos para exportar.");
      return;
    }

    const csvHeaders = [
      "Fecha",
      "N° Comp.",
      "Descripción",
      "Importe",
      "Comprobante URL",
      "Fecha Aprox?",
    ];
    const headerRow = csvHeaders
      .map((h) => `"${h.replace(/"/g, '""')}"`)
      .join(",");

    const formatDateForCSV = (timestamp: Timestamp | undefined): string => {
      if (!timestamp) return "";
      try {
        return timestamp.toDate().toLocaleDateString("es-CL");
      } catch {
        return "Fecha inválida";
      }
    };

    const dataRows = dataToExport.map((row) => {
      const rowValues = [
        formatDateForCSV(row.date),
        row.receiptNumber || "",
        row.description || "",
        row.amount?.toString() || "0",
        row.receiptUrl && row.receiptUrl !== "#" ? row.receiptUrl : "",
        row.isDateApproximate ? "Sí" : "No",
      ];
      return rowValues
        .map((val) => `"${String(val).replace(/"/g, '""')}"`)
        .join(",");
    });

    const csvString = [headerRow, ...dataRows].join("\r\n");

    const blob = new Blob(["\uFEFF" + csvString], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setSnackbar({
        open: true,
        message: "Datos exportados a CSV",
        severity: "success",
      });
    } else {
      alert("Tu navegador no soporta la descarga directa de archivos.");
      setSnackbar({
        open: true,
        message: "Error al exportar: navegador no compatible",
        severity: "error",
      });
    }
  };

  const handleCloseSnackbar = (
    _event?: React.SyntheticEvent | Event,
    reason?: string,
  ) => {
    if (reason === "clickaway") {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };

  const renderTransactionRow = (
    transaction: Transaction,
    isEditing: boolean,
  ) => (
    <EditableTableRow
      key={transaction.id}
      transaction={transaction}
      isEditing={isEditing}
      onEdit={handleEdit}
      onSave={handleSave}
      onCancel={handleCancelEdit}
      onDelete={handleDeleteRequest}
    />
  );

  return (
    <Box sx={{ p: 3, color: "white", backgroundColor: "#121212" }}>
      <Box sx={{ display: "flex", justifyContent: "center" }}>
        <Paper
          sx={{
            p: 5,
            mt: 5,
            backgroundColor: "#1e1e1e",
            color: "white",
            borderTop: "3px solid #4ade80",
            borderRadius: "8px",
            mb: 5,
            maxWidth: "lg",
          }}
        >
          <Typography
            variant="h5"
            sx={{ mb: 5, fontWeight: "bold", textAlign: "center" }}
          >
            Agregar Nuevo Movimiento
          </Typography>
          <Box component="form" onSubmit={handleSubmit}>
            <Grid
              container
              spacing={2}
              justifyContent="center"
              alignItems="center"
            >
              <Grid size={{ xs: 12, md: 2 }}>
                <FormControl
                  fullWidth
                  error={typeError}
                  sx={inputStyles}
                  size="small"
                >
                  <InputLabel id="type-label">Tipo</InputLabel>
                  <Select
                    labelId="type-label"
                    label="Tipo"
                    value={type}
                    onChange={(e) =>
                      setType(e.target.value as "ingreso" | "egreso")
                    }
                  >
                    <MenuItem value="ingreso">Ingreso</MenuItem>
                    <MenuItem value="egreso">Egreso</MenuItem>
                  </Select>
                  {typeError && (
                    <FormHelperText
                      sx={{ color: "#f44336", marginLeft: "14px" }}
                    >
                      Campo requerido
                    </FormHelperText>
                  )}
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <Grid container spacing={1}>
                  <Grid size={{ xs: 4 }}>
                    <FormControl fullWidth sx={inputStyles} size="small">
                      <InputLabel id="year-label">Año</InputLabel>
                      <Select
                        labelId="year-label"
                        label="Año"
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                      >
                        {years.map((y) => (
                          <MenuItem key={y} value={y}>
                            {y}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 4 }}>
                    <FormControl fullWidth sx={inputStyles} size="small">
                      <InputLabel id="month-label">Mes</InputLabel>
                      <Select
                        labelId="month-label"
                        label="Mes"
                        value={month}
                        onChange={(e) => setMonth(e.target.value)}
                      >
                        {months.map((m) => (
                          <MenuItem key={m.value} value={m.value}>
                            {m.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 4 }}>
                    <FormControl
                      fullWidth
                      sx={inputStyles}
                      disabled={isApproximate}
                      size="small"
                    >
                      <InputLabel id="day-label">Día</InputLabel>
                      <Select
                        labelId="day-label"
                        label="Día"
                        value={day}
                        onChange={(e) => setDay(e.target.value)}
                        disabled={isApproximate}
                      >
                        {days.map((d) => (
                          <MenuItem key={d} value={d}>
                            {d}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Descripción"
                  variant="outlined"
                  fullWidth
                  error={descriptionError}
                  helperText={descriptionError ? "Campo requerido" : ""}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  sx={{ ...inputStyles }}
                  size="small"
                />
              </Grid>

              <Grid
                size={{ md: 2 }}
                sx={{ display: { xs: "none", md: "block" } }}
              />
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={isApproximate}
                      onChange={(e) => setIsApproximate(e.target.checked)}
                      sx={{
                        color: "grey.500",
                        "&.Mui-checked": { color: "#4ade80" },
                      }}
                      size="small"
                    />
                  }
                  label="Día desconocido"
                  sx={{
                    color: "grey.400",
                    mt: 0.5,
                    ".MuiFormControlLabel-label": { fontSize: "0.875rem" },
                  }}
                />
              </Grid>
              <Grid
                size={{ md: 6 }}
                sx={{ display: { xs: "none", md: "block" } }}
              />

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Importe (CLP)"
                  type="number"
                  variant="outlined"
                  fullWidth
                  error={!!amountError}
                  helperText={amountError || ""}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Typography sx={{ color: "grey.500" }}>$</Typography>
                      </InputAdornment>
                    ),
                    inputProps: { min: 0, placeholder: "Ej: 50000" },
                  }}
                  sx={inputStyles}
                  size="small"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }} sx={{ mt: -0.7 }}>
                <InputLabel
                  sx={{ color: "grey.500", mb: 1, fontSize: "0.875rem" }}
                >
                  Comprobante (Imagen)
                </InputLabel>
                <Button
                  variant="outlined"
                  component="label"
                  fullWidth
                  startIcon={<CloudUploadIcon />}
                  size="medium"
                  sx={{
                    color: "grey.400",
                    borderColor: "#444",
                    textTransform: "none",
                    justifyContent: "flex-start",
                    "&:hover": {
                      borderColor: "#666",
                      bgcolor: "rgba(255, 255, 255, 0.05)",
                    },
                  }}
                >
                  Seleccionar archivo
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </Button>
                <Typography
                  variant="caption"
                  sx={{ color: "grey.500", display: "block", mt: 0.5 }}
                >
                  {fileName}
                </Typography>
              </Grid>
              <Grid
                size={{ xs: 12 }}
                sx={{ display: "flex", justifyContent: "center", pt: 2 }}
              >
                <Button
                  type="submit"
                  variant="contained"
                  size="medium"
                  disabled={isSubmitting}
                  sx={{
                    backgroundColor: "#4ade80",
                    color: "#1e1e1e",
                    fontWeight: "bold",
                    "&:hover": { backgroundColor: "#20ac53" },
                    "&.Mui-disabled": {
                      backgroundColor: "grey.700",
                      color: "grey.500",
                    },
                  }}
                >
                  {isSubmitting ? "Agregando..." : "Agregar Movimiento"}
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Box>

      {errorTransactions && (
        <Alert severity="error" sx={{ mt: 4 }}>
          {errorTransactions}
        </Alert>
      )}

      <Paper
        sx={{
          width: "100%",
          overflow: "hidden",
          backgroundColor: "#1e1e1e",
          mt: 5,
          p: 2,
        }}
      >
        <Typography
          variant="h6"
          sx={{ fontWeight: "bold", mb: 2, color: "white" }}
        >
          Gestionar Ingresos
        </Typography>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
          <TextField
            label="Buscar por descripción..."
            variant="outlined"
            size="small"
            value={searchIngresos}
            onChange={(e) => handleSearchChange("ingreso", e.target.value)}
            sx={inputStyles}
          />
          <Button
            variant="contained"
            onClick={() => handleExport("ingreso")}
            sx={{
              backgroundColor: "#4ade80",
              color: "#1e1e1e",
              "&:hover": { backgroundColor: "#20ac53" },
            }}
          >
            Exportar
          </Button>
        </Box>
        <TransactionTable
          data={processedIngresos}
          columns={columnsConfig}
          renderRow={renderTransactionRow}
          loading={loadingTransactions}
          error={errorTransactions}
          totalCount={totalIngresos}
          page={pageIngresos}
          rowsPerPage={rowsPerPageIngresos}
          sortConfig={sortIngresos}
          onPageChange={(newPage: number) =>
            handleChangePage("ingreso", newPage)
          }
          onRowsPerPageChange={(
            e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
          ) => handleChangeRowsPerPage("ingreso", e)}
          onSortRequest={(col: keyof Transaction | "") =>
            handleSortRequest("ingreso", col)
          }
          editingRowId={editingRowId}
        />
      </Paper>

      <Paper
        sx={{
          width: "100%",
          overflow: "hidden",
          backgroundColor: "#1e1e1e",
          mt: 5,
          p: 2,
        }}
      >
        <Typography
          variant="h6"
          sx={{ fontWeight: "bold", mb: 2, color: "white" }}
        >
          Gestionar Egresos
        </Typography>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
          <TextField
            label="Buscar por descripción..."
            variant="outlined"
            size="small"
            value={searchEgresos}
            onChange={(e) => handleSearchChange("egreso", e.target.value)}
            sx={inputStyles}
          />
          <Button
            variant="contained"
            onClick={() => handleExport("egreso")}
            sx={{
              backgroundColor: "#4ade80",
              color: "#1e1e1e",
              "&:hover": { backgroundColor: "#20ac53" },
            }}
          >
            Exportar
          </Button>
        </Box>
        <TransactionTable
          data={processedEgresos}
          columns={columnsConfig}
          renderRow={renderTransactionRow}
          loading={loadingTransactions}
          error={errorTransactions}
          totalCount={totalEgresos}
          page={pageEgresos}
          rowsPerPage={rowsPerPageEgresos}
          sortConfig={sortEgresos}
          onPageChange={(newPage: number) =>
            handleChangePage("egreso", newPage)
          }
          onRowsPerPageChange={(
            e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
          ) => handleChangeRowsPerPage("egreso", e)}
          onSortRequest={(col: keyof Transaction | "") =>
            handleSortRequest("egreso", col)
          }
          editingRowId={editingRowId}
        />
      </Paper>

      <ConfirmationDialog
        open={deletingTransaction !== null}
        onClose={handleCloseConfirmDialog}
        onConfirm={handleConfirmDelete}
        title="Confirmar Eliminación"
        message={`¿Estás seguro de que deseas eliminar la transacción "${deletingTransaction?.description}"? Esta acción no se puede deshacer.`}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminPanel;

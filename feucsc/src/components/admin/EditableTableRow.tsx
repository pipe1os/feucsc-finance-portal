
import React, { useState, useEffect } from "react";
import {
  TableRow,
  TableCell,
  TextField,
  Select,
  MenuItem,
  Checkbox,
  IconButton,
  Input,
  Typography,
  Box,
  Link as MuiLink,
  Button,
  CircularProgress,
  SelectChangeEvent,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { Timestamp } from "firebase/firestore";
import { Transaction } from "@/lib/transactions.ts";
import { formatTransactionDate } from "@/lib/utils.ts";

interface EditableTransactionData extends Partial<Transaction> {
  _year?: string;
  _month?: string;
  _day?: string;
}

interface EditableTableRowProps {
  transaction: Transaction;
  isEditing: boolean;
  onSave: (
    id: string,
    updatedData: Partial<Transaction>,
    newFile?: File | null,
  ) => Promise<void>;
  onCancel: () => void;
  onDelete: (transaction: Transaction) => void;
  onEdit: (id: string) => void;
}

const editInputStyles = {
  backgroundColor: "#3a3a3a",
  borderRadius: "4px",
  "& .MuiInputBase-input": {
    color: "white",
    padding: "8px 10px",
  },
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "#555",
  },
  "&:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "#777",
  },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "#4ade80",
  },
  "& .MuiSelect-icon": {
    color: "grey.400",
  },
  "& .MuiInputLabel-root": {
    color: "grey.400",
    "&.Mui-focused": {
      color: "#4ade80",
    },
  },
  "& .MuiSelect-select": {
    color: "white",
  },
};

const EditableTableRow: React.FC<EditableTableRowProps> = ({
                                                             transaction,
                                                             isEditing,
                                                             onSave,
                                                             onCancel,
                                                             onDelete,
                                                             onEdit,
                                                           }) => {
  const [editData, setEditData] = useState<EditableTransactionData>({});
  const [editFile, setEditFile] = useState<File | null>(null);
  const [editFileName, setEditFileName] = useState<string>(
    "Ningún archivo nuevo",
  );
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    if (isEditing) {
      const date = transaction.date?.toDate();
      const year = date ? date.getFullYear().toString() : "";
      const month = date
        ? (date.getMonth() + 1).toString().padStart(2, "0")
        : "";
      const day = date ? date.getDate().toString().padStart(2, "0") : "";

      setEditData({
        ...transaction,
        _year: year,
        _month: month,
        _day: day,
      });
      setEditFile(null);
      setEditFileName("Ningún archivo nuevo");
    } else {
      setEditData({});
    }
  }, [isEditing, transaction]);

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ): void => {
    const { name, value, type } = event.target;
    setEditData((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
  };

  const handleSelectChange = (
    event: SelectChangeEvent,
    name: "_year" | "_month" | "_day",
  ): void => {
    const { value } = event.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, checked } = event.target;
    setEditData((prev) => ({
      ...prev,
      [name]: checked,
      _day: checked
        ? "01"
        : prev._day || new Date().getDate().toString().padStart(2, "0"),
    }));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    if (event.target.files && event.target.files[0]) {
      setEditFile(event.target.files[0]);
      setEditFileName(event.target.files[0].name);
    } else {
      setEditFile(null);
      setEditFileName("Ningún archivo nuevo");
    }
  };

  const handleInternalSave = async (): Promise<void> => {
    setIsSaving(true);
    const year = parseInt(editData._year || "0", 10);
    const month = parseInt(editData._month || "0", 10) - 1;
    const day = parseInt(editData._day || "0", 10);

    let newTimestamp: Timestamp | null = null;
    if (year > 0 && month >= 0 && day > 0) {
      try {
        const { Timestamp: FirebaseTimestamp } = await import(
          "firebase/firestore"
          );
        const date = new Date(Date.UTC(year, month, day));
        if (
          !Number.isNaN(date.getTime()) &&
          date.getUTCFullYear() === year &&
          date.getUTCMonth() === month &&
          date.getUTCDate() === day
        ) {
          newTimestamp = FirebaseTimestamp.fromDate(date);
        }
      } catch (importError) {
        console.error("Error importing Firebase Timestamp:", importError);
        alert(
          "Error al procesar la fecha. Inténtelo de nuevo.",
        );
        setIsSaving(false);
        return;
      }
    }

    if (!newTimestamp) {
      alert("Fecha inválida. Verifique año, mes y día.");
      setIsSaving(false);
      return;
    }

    if (!editData.description?.trim()) {
      alert("La descripción no puede estar vacía.");
      setIsSaving(false);
      return;
    }
    if (
      editData.amount === undefined ||
      editData.amount === null ||
      Number.isNaN(editData.amount) || // Allow zero amount, but not negative
      editData.amount < 0
    ) {
      alert("El importe debe ser un número válido no negativo.");
      setIsSaving(false);
      return;
    }

    const finalData: Partial<Transaction> = {
      description: editData.description,
      amount: editData.amount,
      date: newTimestamp,
      isDateApproximate: !!editData.isDateApproximate,
    };

    try {
      await onSave(transaction.id, finalData, editFile);
    } catch (error: unknown) {
      console.error("Error saving transaction:", error instanceof Error ? error.message : error);
      // Consider showing user feedback here instead of just console logging
      alert(`Error al guardar la transacción: ${error instanceof Error ? error.message : "Error desconocido"}`);
    } finally {
      setIsSaving(false);
    }
  };

  const formatCurrency = (amount: number | undefined): string => {
    if (amount === undefined || amount === null) return "-";
    return `$${amount.toLocaleString("es-CL")}`;
  };

  const cellStyles = {
    color: "white",
    borderBottom: "1px solid #444",
    padding: "6px 10px",
    verticalAlign: "middle",
  };
  const inputCellStyles = { ...cellStyles, padding: "4px 6px" };

  if (isEditing) {
    const yearsOptions: string[] = Array.from({ length: 5 }, (_, i) =>
      (new Date().getFullYear() - i).toString(),
    );
    const monthsOptions: string[] = Array.from({ length: 12 }, (_, i) =>
      (i + 1).toString().padStart(2, "0"),
    );
    const daysOptions: string[] = Array.from({ length: 31 }, (_, i) =>
      (i + 1).toString().padStart(2, "0"),
    );
    const approxCheckboxId = `approx-checkbox-${transaction.id}`;
    const approxLabelId = `approx-label-${transaction.id}`;

    return (
      <TableRow sx={{ "& > td": inputCellStyles }}>
        <TableCell>
          {/* Date Selection */}
          <Box display="flex" gap={0.5}>
            <Select<string>
              name="_year"
              value={editData._year || ""}
              onChange={(e) => handleSelectChange(e, "_year")}
              sx={{ ...editInputStyles, minWidth: 70 }}
              size="small"
              displayEmpty
              variant="outlined"
              aria-label="Año"
            >
              <MenuItem value="" disabled>
                Año
              </MenuItem>
              {yearsOptions.map((y) => (
                <MenuItem key={y} value={y}>
                  {y}
                </MenuItem>
              ))}
            </Select>
            <Select<string>
              name="_month"
              value={editData._month || ""}
              onChange={(e) => handleSelectChange(e, "_month")}
              sx={{ ...editInputStyles, minWidth: 60 }}
              size="small"
              displayEmpty
              variant="outlined"
              aria-label="Mes"
            >
              <MenuItem value="" disabled>
                Mes
              </MenuItem>
              {monthsOptions.map((m) => (
                <MenuItem key={m} value={m}>
                  {m}
                </MenuItem>
              ))}
            </Select>
            <Select<string>
              name="_day"
              value={editData._day || ""}
              onChange={(e) => handleSelectChange(e, "_day")}
              disabled={!!editData.isDateApproximate}
              sx={{ ...editInputStyles, minWidth: 60 }}
              size="small"
              displayEmpty
              variant="outlined"
              aria-label="Día"
            >
              <MenuItem value="" disabled>
                Día
              </MenuItem>
              {daysOptions.map((d) => (
                <MenuItem key={d} value={d}>
                  {d}
                </MenuItem>
              ))}
            </Select>
          </Box>
          {/* Approximate Date Checkbox */}
          <Box sx={{ display: "flex", alignItems: "center", mt: 0.5 }}>
            <Checkbox
              id={approxCheckboxId}
              name="isDateApproximate"
              checked={!!editData.isDateApproximate}
              onChange={handleCheckboxChange}
              size="small"
              sx={{
                padding: "0 4px 0 0",
                color: "grey.500",
                "&.Mui-checked": { color: "#4ade80" },
              }}
              aria-labelledby={approxLabelId}
            />
            <Typography
              id={approxLabelId}
              component="label" // Use label component for better semantics
              htmlFor={approxCheckboxId} // Associate label with checkbox
              variant="caption"
              sx={{ color: "grey.400", cursor: 'pointer' }} // Add pointer cursor
            >
              Aprox.
            </Typography>
          </Box>
        </TableCell>
        {/* Receipt Number (Readonly) */}
        <TableCell>{transaction.receiptNumber || "-"}</TableCell>
        {/* Description */}
        <TableCell>
          <TextField
            name="description"
            value={editData.description || ""}
            onChange={handleInputChange}
            variant="outlined"
            size="small"
            fullWidth
            sx={editInputStyles}
            aria-label="Descripción"
          />
        </TableCell>
        {/* Amount */}
        <TableCell>
          <TextField
            name="amount"
            type="number"
            value={editData.amount ?? ""}
            onChange={handleInputChange}
            variant="outlined"
            size="small"
            fullWidth
            sx={editInputStyles}
            slotProps={{ input: { inputProps: { min: 0 } }}}
            aria-label="Importe"
          />
        </TableCell>
        {/* File Upload */}
        <TableCell>
          <Input
            type="file"
            onChange={handleFileChange}
            sx={{ display: "none" }}
            id={`edit-file-${transaction.id}`}
            inputProps={{ accept: "image/*,application/pdf" }} // Allow PDF too
          />
          <label htmlFor={`edit-file-${transaction.id}`}>
            <Button
              variant="outlined"
              component="span"
              size="small"
              startIcon={<CloudUploadIcon />}
              sx={{
                color: "grey.400",
                borderColor: "#444",
                textTransform: "none",
                fontSize: "0.75rem",
                padding: "2px 8px",
                "&:hover": {
                  borderColor: "#666",
                  bgcolor: "rgba(255, 255, 255, 0.05)",
                },
              }}
              aria-label="Cambiar archivo de comprobante"
            >
              Cambiar
            </Button>
          </label>
          <Typography
            variant="caption"
            sx={{
              display: "block",
              mt: 0.5,
              color: "grey.500",
              fontSize: "0.7rem",
              overflow: "hidden", // Prevent long names from breaking layout
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: '120px', // Adjust as needed
            }}
            title={editFileName} // Show full name on hover
          >
            {editFileName}
          </Typography>
          {transaction.receiptUrl != null && transaction.receiptUrl !== "#" && (
            <MuiLink
              href={transaction.receiptUrl}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                fontSize: "0.7rem",
                display: "block",
                mt: 0.5,
                color: "#a855f7",
              }}
            >
              Ver actual
            </MuiLink>
          )}
        </TableCell>
        {/* Actions */}
        <TableCell align="right">
          <IconButton
            onClick={handleInternalSave}
            size="small"
            disabled={isSaving}
            aria-label="Guardar cambios"
          >
            {isSaving ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              <SaveIcon sx={{ color: "#4ade80" }} />
            )}
          </IconButton>
          <IconButton
            onClick={onCancel}
            size="small"
            disabled={isSaving}
            aria-label="Cancelar edición"
          >
            <CancelIcon sx={{ color: "grey.500" }} />
          </IconButton>
        </TableCell>
      </TableRow>
    );
  } else {
    // Display Row (Not Editing)
    const hasValidUrl =
      transaction.receiptUrl && transaction.receiptUrl !== "#";
    const amountColor = transaction.type === "ingreso" ? "#4ade80" : "#f472b6";

    return (
      <TableRow hover sx={{ "& > td": cellStyles }}>
        <TableCell>
          {formatTransactionDate(
            transaction.date,
            transaction.isDateApproximate,
          )}
        </TableCell>
        <TableCell>{transaction.receiptNumber || "-"}</TableCell>
        <TableCell>{transaction.description || "-"}</TableCell>
        <TableCell
          align="right"
          sx={{ color: amountColor, fontWeight: "bold" }}
        >
          {formatCurrency(transaction.amount)}
        </TableCell>
        <TableCell>
          {hasValidUrl ? (
            <MuiLink
              href={transaction.receiptUrl}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ color: "#a855f7" }}
            >
              Ver
            </MuiLink>
          ) : (
            "-"
          )}
        </TableCell>
        <TableCell align="right">
          <IconButton
            onClick={() => onEdit(transaction.id)}
            size="small"
            aria-label={`Editar transacción ${transaction.description}`}
          >
            <EditIcon sx={{ color: "grey.500", fontSize: "1.1rem" }} />
          </IconButton>
          <IconButton
            onClick={() => onDelete(transaction)}
            size="small"
            aria-label={`Eliminar transacción ${transaction.description}`}
          >
            <DeleteIcon sx={{ color: "#f472b6", fontSize: "1.1rem" }} />
          </IconButton>
        </TableCell>
      </TableRow>
    );
  }
};

export default EditableTableRow;

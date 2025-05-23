import { memo } from "react";
import React, { useMemo } from "react";
import {
  Box,
  Tabs,
  Tab,
  Chip,
  Typography,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableSortLabel,
  Button,
  TablePagination,
  CircularProgress,
  Alert,
  Skeleton,
} from "@mui/material";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import { m } from "motion/react";
import { Timestamp } from "firebase/firestore";
import { formatTransactionDate } from "../lib/utils";

interface Transaction {
  id: string;
  addedBy: string;
  amount: number;
  createdAt: Timestamp;
  date: Timestamp;
  description: string;
  isDateApproximate: boolean;
  receiptNumber: string;
  receiptUrl: string;
  type: "ingreso" | "egreso";
}

const MTab = m.create(Tab);
const MTableRow = m.create(TableRow);

interface TransactionViewProps {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  handleVerComprobante: (receiptNumber: string | null | undefined) => void;
  setLightboxImageUrl: (url: string | null) => void;
  mainTab: number;
  page: number;
  rowsPerPage: number;
  monthFilter: string;
  orderBy: "fecha" | "nBoleta";
  sortOrder: "asc" | "desc";
  searchQuery: string;
  onMainTabChange: (event: React.SyntheticEvent, newValue: number) => void;
  onMonthFilterChange: (month: string) => void;
  onSortRequest: (property: "fecha" | "nBoleta") => void;
  onChangePage: (event: unknown, newPage: number) => void;
  onChangeRowsPerPage: (event: React.ChangeEvent<HTMLInputElement>) => void;
  targetReceiptNumber: string | null;
}

function TransactionView({
  transactions,
  loading,
  error,
  handleVerComprobante,
  setLightboxImageUrl,
  mainTab,
  page,
  rowsPerPage,
  monthFilter,
  orderBy,
  sortOrder,
  searchQuery,
  onMainTabChange,
  onMonthFilterChange,
  onSortRequest,
  onChangePage,
  onChangeRowsPerPage,
  targetReceiptNumber,
}: TransactionViewProps) {
  const filteredTransactions = useMemo(
    () =>
      transactions.filter((tx) => {
        if (mainTab === 0 && tx.type !== "ingreso") return false;
        if (mainTab === 1 && tx.type !== "egreso") return false;

        if (mainTab !== 2 && monthFilter !== "Todos") {
          const monthNames = [
            "Ene",
            "Feb",
            "Mar",
            "Abr",
            "May",
            "Jun",
            "Jul",
            "Ago",
            "Sep",
            "Oct",
            "Nov",
            "Dic",
          ];
          const [filterMonthStr, filterYearStr] = monthFilter.split(" ");
          const filterMonthIndex = monthNames.findIndex(
            (m) => m === filterMonthStr,
          );
          const filterYear = parseInt(`20${filterYearStr}`, 10);
          if (filterMonthIndex !== -1 && !isNaN(filterYear)) {
            const txDate = tx.date.toDate();
            if (
              txDate.getMonth() !== filterMonthIndex ||
              txDate.getFullYear() !== filterYear
            ) {
              return false;
            }
          }
        }

        if (searchQuery.trim() !== "") {
          const query = searchQuery.toLowerCase().trim();
          const descriptionMatches = tx.description
            .toLowerCase()
            .includes(query);
          const receiptNumberMatches =
            tx.receiptNumber?.toLowerCase().includes(query) || false;

          if (!descriptionMatches && !receiptNumberMatches) {
            return false;
          }
        }

        return true;
      }),
    [transactions, mainTab, monthFilter, searchQuery],
  );

  const sortedTransactions = useMemo(
    () =>
      [...filteredTransactions].sort((a, b) => {
        const field = orderBy === "fecha" ? "date" : "receiptNumber";
        const orderMultiplier = sortOrder === "asc" ? 1 : -1;
        let comparison = 0;
        if (field === "date") {
          comparison = a.date.toMillis() - b.date.toMillis();
        } else if (field === "receiptNumber") {
          const numA = parseInt(
            a.receiptNumber?.replace(/[^0-9]/g, "") || "0",
            10,
          );
          const numB = parseInt(
            b.receiptNumber?.replace(/[^0-9]/g, "") || "0",
            10,
          );
          comparison = (isNaN(numA) ? 0 : numA) - (isNaN(numB) ? 0 : numB);
        }
        return comparison * orderMultiplier;
      }),
    [filteredTransactions, orderBy, sortOrder],
  );

  const paginatedTransactions = sortedTransactions.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  const comprobantesData = useMemo(() => {
    return transactions
      .filter((tx) => {
        if (!tx.receiptUrl || tx.receiptUrl === "#" || !tx.receiptNumber) {
          return false;
        }

        if (monthFilter !== "Todos") {
          const monthNames = [
            "Ene",
            "Feb",
            "Mar",
            "Abr",
            "May",
            "Jun",
            "Jul",
            "Ago",
            "Sep",
            "Oct",
            "Nov",
            "Dic",
          ];
          const [filterMonthStr, filterYearStr] = monthFilter.split(" ");
          const filterMonthIndex = monthNames.findIndex(
            (m) => m === filterMonthStr,
          );
          const filterYear = parseInt(`20${filterYearStr}`, 10);
          if (filterMonthIndex !== -1 && !isNaN(filterYear)) {
            const txDate = tx.date.toDate();
            if (
              txDate.getMonth() !== filterMonthIndex ||
              txDate.getFullYear() !== filterYear
            ) {
              return false;
            }
          }
        }

        if (searchQuery.trim() !== "") {
          const query = searchQuery.toLowerCase().trim();
          const descriptionMatches = tx.description
            .toLowerCase()
            .includes(query);
          const receiptNumberMatches =
            tx.receiptNumber?.toLowerCase().includes(query) || false;

          if (!descriptionMatches && !receiptNumberMatches) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => b.date.toMillis() - a.date.toMillis());
  }, [transactions, monthFilter, searchQuery]);

  const paginatedComprobantes = comprobantesData.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  return (
    <Box>
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs
          value={mainTab}
          onChange={onMainTabChange}
          aria-label="Pestañas principales"
          sx={{
            minHeight: "auto",
            "& .MuiTabs-indicator": {
              backgroundColor: "#a855f7",
            },
          }}
        >
          <MTab
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            transition={{ duration: 0.2 }}
            icon={<AccountBalanceWalletOutlinedIcon />}
            iconPosition="start"
            label="Ingresos"
            sx={{
              color: mainTab === 0 ? "#a855f7" : "grey.500",
              minHeight: { xs: 40, sm: 48 },
              textTransform: "none",
              px: { xs: 1, sm: 2 },
              fontSize: { xs: "0.75rem", sm: "0.875rem" },
              minWidth: { xs: 80, sm: 120 },
              padding: "6px 12px",
              mx: 1,
            }}
          />
          <MTab
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            transition={{ duration: 0.2 }}
            icon={<ReceiptLongOutlinedIcon />}
            iconPosition="start"
            label="Egresos"
            sx={{
              color: mainTab === 1 ? "#a855f7" : "grey.500",
              minHeight: { xs: 40, sm: 48 },
              textTransform: "none",
              px: { xs: 1, sm: 2 },
              fontSize: { xs: "0.75rem", sm: "0.875rem" },
              minWidth: { xs: 80, sm: 120 },
              padding: "6px 12px",
              mx: 1,
            }}
          />
          <MTab
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            transition={{ duration: 0.2 }}
            icon={<DescriptionOutlinedIcon />}
            iconPosition="start"
            label="Comprobantes"
            sx={{
              color: mainTab === 1 ? "#a855f7" : "grey.500",
              minHeight: { xs: 40, sm: 48 },
              textTransform: "none",
              px: { xs: 1, sm: 2 },
              fontSize: { xs: "0.75rem", sm: "0.875rem" },
              minWidth: { xs: 80, sm: 120 },
              padding: "6px 12px",
              mx: 1,
            }}
          />
        </Tabs>
      </Box>
      <Box className="mt-4 flex flex-wrap items-center gap-2">
        {["Todos", "Abr 25", "Mar 25", "Feb 25", "Ene 25", "Dic 24"].map(
          (month) => (
            <Chip
              key={month}
              label={month}
              onClick={() => onMonthFilterChange(month)}
              sx={{
                backgroundColor: monthFilter === month ? "#a855f7" : "#333",
                color: monthFilter === month ? "white" : "grey.400",
                cursor: "pointer",
                "&:hover": {
                  backgroundColor: monthFilter === month ? "#9333ea" : "#444",
                },
              }}
            />
          ),
        )}
      </Box>

      <Box className="mt-6">
        <Typography
          variant="h5"
          component="h2"
          gutterBottom
          sx={{ color: "white", fontWeight: "bold" }}
        >
          {mainTab === 0
            ? "Ingresos"
            : mainTab === 1
              ? "Egresos"
              : "Comprobantes"}
        </Typography>

        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
            <CircularProgress color="secondary" />
          </Box>
        )}
        {error && !loading && (
          <Alert severity="error" sx={{ my: 2 }}>
            {error}
          </Alert>
        )}

        {!loading && !error && (
          <>
            {mainTab === 0 || mainTab === 1 ? (
              <TableContainer
                sx={(theme) => ({
                  backgroundColor: "#2a2a2a",
                  borderRadius: "4px",
                  overflow: "hidden",
                  [theme.breakpoints.down("md")]: {
                    backgroundColor: "transparent",
                  },
                })}
              >
                <Table
                  stickyHeader
                  sx={(theme) => ({
                    [theme.breakpoints.down("md")]: {
                      borderCollapse: "collapse",
                      width: "100%",
                      display: "block",
                      thead: {
                        display: "none",
                      },
                      tbody: {
                        display: "block",
                      },
                      "& .MuiTableRow-root": {
                        display: "block",
                        marginBottom: "1rem",
                        border: "1px solid #444",
                        borderRadius: "4px",
                        padding: "0.5rem",
                      },
                      "& .MuiTableCell-root": {
                        display: "block",
                        textAlign: "right !important",
                        paddingLeft: "50% !important",
                        position: "relative",
                        borderBottom: "none",
                        "&::before": {
                          content: "attr(data-label)",
                          position: "absolute",
                          left: "0.5rem",
                          width: "calc(50% - 1rem)",
                          paddingRight: "10px",
                          whiteSpace: "nowrap",
                          textAlign: "left",
                          fontWeight: "bold",
                          color: "grey.400",
                        },
                      },
                      "& td[data-label='IMPORTE']": {
                        fontWeight: "bold",
                      },
                      "& td[data-label='COMPROBANTE']": {
                        textAlign: "center !important",
                        paddingLeft: "0 !important",
                        "&::before": {
                          display: "none",
                        },
                        "& .MuiButton-root": {
                          width: "100%",
                        },
                      },
                    },
                  })}
                >
                  <TableHead
                    sx={(theme) => ({
                      [theme.breakpoints.down("md")]: {
                        display: "none",
                      },
                      "& .MuiTableCell-root": {
                        backgroundColor: "#333",
                        color: "grey.400",
                        borderBottom: "1px solid #444",
                        fontWeight: "bold",
                      },
                    })}
                  >
                    <TableRow>
                      <TableCell>
                        <TableSortLabel
                          active={orderBy === "fecha"}
                          direction={orderBy === "fecha" ? sortOrder : "asc"}
                          onClick={() => onSortRequest("fecha")}
                          IconComponent={ArrowDownwardIcon}
                          sx={{
                            "&.Mui-active": { color: "white" },
                            "& .MuiTableSortLabel-icon": {
                              color: "grey.400 !important",
                            },
                          }}
                        >
                          FECHA
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={orderBy === "nBoleta"}
                          direction={orderBy === "nBoleta" ? sortOrder : "asc"}
                          onClick={() => onSortRequest("nBoleta")}
                          IconComponent={ArrowDownwardIcon}
                          sx={{
                            "&.Mui-active": { color: "white" },
                            "& .MuiTableSortLabel-icon": {
                              color: "grey.400 !important",
                            },
                          }}
                        >
                          N° BOLETA/COMP.
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>DESCRIPCIÓN</TableCell>
                      <TableCell align="right">IMPORTE</TableCell>
                      <TableCell align="center">COMPROBANTE</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      Array.from(new Array(rowsPerPage)).map((_, index) => (
                        <MTableRow key={`skel-ie-${index}`}>
                          <TableCell>
                            <Skeleton
                              variant="text"
                              sx={{ bgcolor: "grey.700" }}
                            />
                          </TableCell>
                          <TableCell>
                            <Skeleton
                              variant="text"
                              sx={{ bgcolor: "grey.700" }}
                            />
                          </TableCell>
                          <TableCell>
                            <Skeleton
                              variant="text"
                              sx={{ bgcolor: "grey.700" }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Skeleton
                              variant="text"
                              sx={{ bgcolor: "grey.700" }}
                              width={80}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Skeleton
                              variant="rectangular"
                              sx={{ bgcolor: "grey.700" }}
                              width={60}
                              height={24}
                            />
                          </TableCell>
                        </MTableRow>
                      ))
                    ) : paginatedTransactions.length > 0 ? (
                      paginatedTransactions.map((row) => {
                        const isHighlighted =
                          targetReceiptNumber === row.receiptNumber;
                        return (
                          <MTableRow
                            key={row.id}
                            id={`comprobante-${row.receiptNumber}`}
                            whileHover={{
                              scale: 1.01,
                              y: -2,
                            }}
                            transition={{
                              type: "spring",
                              stiffness: 300,
                              damping: 20,
                              duration: 0.2,
                            }}
                            sx={(theme) => {
                              return {
                                position: "relative",
                                transition: "background-color 0.2s ease-in-out",
                                backgroundColor: isHighlighted
                                  ? "rgba(168, 85, 247, 0.15)"
                                  : "transparent",
                                "&:last-child td, &:last-child th": {
                                  border: 0,
                                },
                                "& .MuiTableCell-root": {
                                  borderBottom: "1px solid #444",
                                  color: "white",
                                },
                                [theme.breakpoints.down("md")]: {
                                  backgroundColor: isHighlighted
                                    ? "rgba(168, 85, 247, 0.15)"
                                    : "#2a2a2a",
                                },
                              };
                            }}
                          >
                            <TableCell
                              component="th"
                              scope="row"
                              data-label="FECHA"
                            >
                              {formatTransactionDate(
                                row.date,
                                row.isDateApproximate,
                              )}
                            </TableCell>
                            <TableCell data-label="N° BOLETA/COMP.">
                              {row.receiptNumber || "-"}
                            </TableCell>
                            <TableCell data-label="DESCRIPCIÓN">
                              {row.description}
                            </TableCell>
                            <TableCell
                              align="right"
                              data-label="IMPORTE"
                              sx={{
                                color:
                                  row.type === "ingreso"
                                    ? "#22c55e !important"
                                    : "#ec4899 !important",
                                fontWeight: "bold",
                              }}
                            >{`$${new Intl.NumberFormat("es-CL").format(row.amount)}`}</TableCell>
                            <TableCell align="center" data-label="COMPROBANTE">
                              <Button
                                variant="contained"
                                size="small"
                                disabled={!row.receiptNumber}
                                onClick={() =>
                                  handleVerComprobante(row.receiptNumber)
                                }
                                startIcon={
                                  <VisibilityOutlinedIcon fontSize="small" />
                                }
                                sx={{
                                  backgroundColor: "#a855f7",
                                  color: "white",
                                  textTransform: "none",
                                  fontSize: "0.75rem",
                                  padding: "3px 10px",
                                  minWidth: "auto",
                                  "&:hover": {
                                    backgroundColor: "#9333ea",
                                  },
                                  "&.Mui-disabled": {
                                    backgroundColor: "rgba(168, 85, 247, 0.3)",
                                    color: "rgba(255,255,255,0.3)",
                                  },
                                }}
                              >
                                Ver
                              </Button>
                            </TableCell>
                          </MTableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          align="center"
                          sx={{
                            color: "grey.500",
                            borderBottom: "1px solid #444",
                          }}
                        >
                          No hay {mainTab === 0 ? "Ingresos" : "Egresos"} para
                          mostrar...
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <TableContainer
                sx={(theme) => ({
                  backgroundColor: "#2a2a2a",
                  borderRadius: "4px",
                  overflow: "hidden",
                  [theme.breakpoints.down("md")]: {
                    backgroundColor: "transparent",
                  },
                })}
              >
                <Table
                  stickyHeader
                  sx={(theme) => ({
                    [theme.breakpoints.down("md")]: {
                      borderCollapse: "collapse",
                      width: "100%",
                      display: "block",
                      thead: {
                        display: "none",
                      },
                      tbody: {
                        display: "block",
                      },
                      "& .MuiTableRow-root": {
                        display: "block",
                        marginBottom: "1rem",
                        border: "1px solid #444",
                        borderRadius: "4px",
                        padding: "0.5rem",
                      },
                      "& .MuiTableCell-root": {
                        display: "block",
                        textAlign: "right !important",
                        paddingLeft: "50% !important",
                        position: "relative",
                        borderBottom: "none",
                        "&::before": {
                          content: "attr(data-label)",
                          position: "absolute",
                          left: "0.5rem",
                          width: "calc(50% - 1rem)",
                          paddingRight: "10px",
                          whiteSpace: "nowrap",
                          textAlign: "left",
                          fontWeight: "bold",
                          color: "grey.400",
                        },
                      },
                      "& td[data-label='Ver Imagen']": {
                        textAlign: "center !important",
                        paddingLeft: "0 !important",
                        "&::before": {
                          display: "none",
                        },
                        "& .MuiButton-root": {
                          width: "100%",
                        },
                      },
                    },
                  })}
                >
                  <TableHead
                    sx={(theme) => ({
                      [theme.breakpoints.down("md")]: {
                        display: "none",
                      },
                      "& .MuiTableCell-root": {
                        backgroundColor: "#333",
                        color: "grey.400",
                        borderBottom: "1px solid #444",
                        fontWeight: "bold",
                      },
                    })}
                  >
                    <TableRow>
                      <TableCell>Fecha</TableCell>
                      <TableCell>N° Comp.</TableCell>
                      <TableCell>Descripción</TableCell>
                      <TableCell align="center">Ver Imagen</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      Array.from(new Array(rowsPerPage)).map((_, index) => (
                        <MTableRow key={`skel-comp-${index}`}>
                          <TableCell>
                            <Skeleton
                              variant="text"
                              sx={{ bgcolor: "grey.700" }}
                            />
                          </TableCell>
                          <TableCell>
                            <Skeleton
                              variant="text"
                              sx={{ bgcolor: "grey.700" }}
                            />
                          </TableCell>
                          <TableCell>
                            <Skeleton
                              variant="text"
                              sx={{ bgcolor: "grey.700" }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Skeleton
                              variant="rectangular"
                              sx={{ bgcolor: "grey.700" }}
                              width={100}
                              height={24}
                            />
                          </TableCell>
                        </MTableRow>
                      ))
                    ) : paginatedComprobantes.length > 0 ? (
                      paginatedComprobantes.map((row) => (
                        <MTableRow
                          key={row.id}
                          id={`comprobante-${row.receiptNumber}`}
                          whileHover={{
                            scale: 1.01,
                            y: -2,
                          }}
                          transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 20,
                            duration: 0.2,
                          }}
                          sx={(theme) => {
                            const isHighlighted =
                              targetReceiptNumber === row.receiptNumber;
                            return {
                              position: "relative",
                              transition: "background-color 0.2s ease-in-out",
                              backgroundColor: isHighlighted
                                ? "rgba(168, 85, 247, 0.15)"
                                : "transparent",
                              "&:last-child td, &:last-child th": { border: 0 },
                              "& .MuiTableCell-root": {
                                borderBottom: "1px solid #444",
                                color: "white",
                              },
                              [theme.breakpoints.down("md")]: {
                                backgroundColor: isHighlighted
                                  ? "rgba(168, 85, 247, 0.15)"
                                  : "#2a2a2a",
                              },
                            };
                          }}
                        >
                          <TableCell data-label="Fecha">
                            {formatTransactionDate(
                              row.date,
                              row.isDateApproximate,
                            )}
                          </TableCell>
                          <TableCell data-label="N° Comp.">
                            {row.receiptNumber}
                          </TableCell>
                          <TableCell data-label="Descripción">
                            {row.description}
                          </TableCell>
                          <TableCell align="center" data-label="Ver Imagen">
                            <Button
                              variant="contained"
                              size="small"
                              onClick={() =>
                                setLightboxImageUrl(row.receiptUrl || null)
                              }
                              startIcon={<ImageOutlinedIcon fontSize="small" />}
                              sx={{
                                backgroundColor: "#a855f7",
                                color: "white",
                                textTransform: "none",
                                fontSize: "0.75rem",
                                padding: "3px 10px",
                                minWidth: "auto",
                                "&:hover": { backgroundColor: "#9333ea" },
                              }}
                            >
                              Ver Imagen
                            </Button>
                          </TableCell>
                        </MTableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          align="center"
                          sx={{
                            color: "grey.500",
                            borderBottom: "1px solid #444",
                          }}
                        >
                          No hay comprobantes para mostrar.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={
                loading
                  ? 0
                  : mainTab === 2
                    ? comprobantesData.length
                    : sortedTransactions.length
              }
              rowsPerPage={rowsPerPage}
              page={loading ? 0 : page}
              onPageChange={onChangePage}
              onRowsPerPageChange={onChangeRowsPerPage}
              labelRowsPerPage="Filas por página:"
              labelDisplayedRows={({ from, to, count }) =>
                `${from}–${to} de ${count !== -1 ? count : `más de ${to}`}`
              }
              sx={(theme) => ({
                color: "grey.400",
                borderTop: "1px solid #444",
                paddingTop: "8px",
                marginTop: "16px",
                [theme.breakpoints.down("sm")]: {
                  "& .MuiTablePagination-toolbar": {
                    flexDirection: "column",
                    alignItems: "flex-start",
                    gap: "8px",
                  },
                  "& .MuiTablePagination-spacer": {
                    display: "none",
                  },
                  "& .MuiTablePagination-selectLabel, & .MuiTablePagination-select, & .MuiTablePagination-displayedRows, & .MuiTablePagination-actions":
                    {
                      marginLeft: "0 !important",
                    },
                  "& .MuiInputBase-root": {
                    marginRight: "auto",
                  },
                },
                "& .MuiSelect-icon": { color: "grey.400" },
                "& .Mui-disabled": {
                  color: "grey.700 !important",
                  "& .MuiSvgIcon-root": { color: "grey.700 !important" },
                },
                "& .MuiButtonBase-root": { color: "grey.400" },
                "& .MuiButtonBase-root:not(.Mui-disabled):hover": {
                  backgroundColor: "rgba(255, 255, 255, 0.08)",
                },
                pointerEvents: loading ? "none" : "auto",
                opacity: loading ? 0.6 : 1,
              })}
            />
          </>
        )}
      </Box>
    </Box>
  );
}

export default memo(TransactionView);

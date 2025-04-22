import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TablePagination,
  Paper,
  Box,
  CircularProgress,
  Typography,
} from "@mui/material";
import { visuallyHidden } from "@mui/utils";
import { Transaction } from "../../lib/transactions";

type Order = "asc" | "desc";

export interface ColumnConfig {
  id: keyof Transaction | "actions";
  label: string;
  numeric?: boolean;
  sortable?: boolean;
  minWidth?: number;
  align?: "right" | "left" | "center";
  format?: (value: any, row: Transaction) => React.ReactNode;
}

interface TransactionTableProps {
  data: Transaction[];
  columns: ColumnConfig[];
  renderRow: (row: Transaction, isEditing: boolean) => React.ReactNode;
  loading: boolean;
  error: string | null;
  totalCount: number;
  page: number;
  rowsPerPage: number;
  sortConfig: { column: keyof Transaction | ""; direction: Order };
  onPageChange: (newPage: number) => void;
  onRowsPerPageChange: (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  onSortRequest: (columnId: keyof Transaction) => void;
  editingRowId: string | null;
}

const TransactionTable: React.FC<TransactionTableProps> = ({
  data,
  columns,
  renderRow,
  loading,
  error,
  totalCount,
  page,
  rowsPerPage,
  sortConfig,
  onPageChange,
  onRowsPerPageChange,
  onSortRequest,
  editingRowId,
}) => {
  const handleRequestSort = (property: keyof Transaction) => {
    onSortRequest(property);
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    onPageChange(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    onRowsPerPageChange(event);
  };

  const headerStyles = {
    backgroundColor: "#2a2a2a",
    color: "grey.400",
    fontWeight: "bold",
    borderBottom: "2px solid #444",
  };

  const cellStyles = {
    color: "white",
    borderBottom: "1px solid #444",
  };

  return (
    <Paper
      sx={{
        width: "100%",
        overflow: "hidden",
        backgroundColor: "#1e1e1e",
        mt: 2,
      }}
    >
      <TableContainer sx={{ maxHeight: 500 }}>
        <Table stickyHeader aria-label="sticky table">
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={String(column.id)}
                  align={column.align || "left"}
                  style={{ minWidth: column.minWidth }}
                  sx={headerStyles}
                  sortDirection={
                    sortConfig.column === column.id
                      ? sortConfig.direction
                      : false
                  }
                >
                  {column.sortable ? (
                    <TableSortLabel
                      active={sortConfig.column === column.id}
                      direction={
                        sortConfig.column === column.id
                          ? sortConfig.direction
                          : "asc"
                      }
                      onClick={() =>
                        column.sortable &&
                        handleRequestSort(column.id as keyof Transaction)
                      }
                      sx={{
                        color: "inherit !important",
                        "& .MuiTableSortLabel-icon": {
                          color: "grey.500 !important",
                        },
                      }}
                    >
                      {column.label}
                      {sortConfig.column === column.id ? (
                        <Box component="span" sx={visuallyHidden}>
                          {sortConfig.direction === "desc"
                            ? "sorted descending"
                            : "sorted ascending"}
                        </Box>
                      ) : null}
                    </TableSortLabel>
                  ) : (
                    column.label
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  align="center"
                  sx={cellStyles}
                >
                  <CircularProgress size={24} sx={{ color: "grey.500" }} />
                  <Typography
                    variant="caption"
                    sx={{ display: "block", color: "grey.500" }}
                  >
                    Cargando...
                  </Typography>
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  align="center"
                  sx={{ ...cellStyles, color: "error.main" }}
                >
                  {error}
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  align="center"
                  sx={{ ...cellStyles, color: "grey.600" }}
                >
                  No se encontraron movimientos.
                </TableCell>
              </TableRow>
            ) : (
              data.map((row) => renderRow(row, editingRowId === row.id))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={totalCount}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        sx={{
          color: "grey.500",
          borderTop: "1px solid #444",
          "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows":
            {
              color: "grey.500",
            },
          "& .MuiSelect-icon": {
            color: "grey.500",
          },
          "& .MuiButtonBase-root.Mui-disabled": {
            color: "grey.700",
          },
        }}
      />
    </Paper>
  );
};

export default TransactionTable;

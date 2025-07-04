import { styled } from '@mui/material/styles';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell, { tableCellClasses } from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { useEffect } from 'react';
import dayjs from 'dayjs';
import { IEncodedLog } from '@/ipc-shared/Log';
import { TableFooter, TablePagination } from '@mui/material';
import { TablePaginationActions } from '@/components/update/TablePaginationActions';

const StyledTableCell = styled(TableCell)(({ theme }) => ({
    [`&.${tableCellClasses.head}`]: {
        backgroundColor: theme.palette.common.black,
        color: theme.palette.common.white,
    },
    [`&.${tableCellClasses.body}`]: {
        fontSize: 14,
    },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
    '&:nth-of-type(odd)': {
        backgroundColor: theme.palette.action.hover,
    },
    '&:last-child td, &:last-child th': {
        border: 0,
    },
}));

export default function BillsTable({ 
    rows,
    page,
    rowsPerPage,
    handleChangePage,
    handleChangeRowsPerPage,
 }: { rows: IEncodedLog[]
     page: number,
    rowsPerPage: number,
    handleChangePage: (event: React.MouseEvent<HTMLButtonElement> | null, page: number) => void,
    handleChangeRowsPerPage?: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>,
  }) {

    useEffect(() => {
        // console.log("Row length in BillsTable: ", rows.length);
        // console.log("Rows in BillsTable: ", rows[rows.length - 1]);
    }, [rows]);

    return (
        <TableContainer component={Paper} sx={{maxHeight: 400, overflow: 'auto'}}>
            <Table sx={{ minWidth: 800,   tableLayout: 'fixed' }} aria-label="customized table" stickyHeader>
                <TableHead>
                    <TableRow>
                        <StyledTableCell align="center"  sx={{ width: 80 }}>Device MAC</StyledTableCell>
                        <StyledTableCell align="center" sx={{ width: 160 }}>Thời gian</StyledTableCell>
                        <StyledTableCell align="center" sx={{ width: 80 }}>Số tiền</StyledTableCell>
                        <StyledTableCell align="center" sx={{ width: 40 }}>Lít</StyledTableCell>
                        <StyledTableCell align="center" sx={{ width: 80 }}>Đơn giá</StyledTableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {rows?.map((row: IEncodedLog, index: number) => (
                        <StyledTableRow key={index}>
                            <StyledTableCell align="center" sx={{ maxWidth: 40, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {row.device_id}
                            </StyledTableCell>
                            <StyledTableCell align="center">
                                {dayjs(Number(row?.timestamp)).format("DD/MM/YYYY hh:mm:ss A")}
                            </StyledTableCell>
                            <StyledTableCell align="center" sx={{ width: 80 }}>
                                {row["cost"]}
                            </StyledTableCell>
                            <StyledTableCell align="center" sx={{ width: 60 }}>
                                {row["volume"]}
                            </StyledTableCell>
                            <StyledTableCell align="center" sx={{ width: 80 }}>
                                {row["price"]}
                            </StyledTableCell>
                        </StyledTableRow>
                    ))}
                </TableBody>

                <TableFooter>

                     <TablePagination
              rowsPerPageOptions={[5, 10, 25, { label: 'All', value: -1 }]}
              colSpan={3}
              count={rows.length}
              rowsPerPage={rowsPerPage}
              page={page}
              slotProps={{
                select: {
                  inputProps: {
                    'aria-label': 'Số hàng/trang',
                  },
                  native: true,
                },
              }}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              ActionsComponent={TablePaginationActions}
            />

                </TableFooter>
            </Table>
        </TableContainer>
    );
}

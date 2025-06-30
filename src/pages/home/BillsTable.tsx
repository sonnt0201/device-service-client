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
import { IEncodedLog } from 'electron/ipc-shared/Log';

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

export default function BillsTable({ rows }: { rows: IEncodedLog[] }) {

    useEffect(() => {
        // console.log("Row length in BillsTable: ", rows.length);
        // console.log("Rows in BillsTable: ", rows[rows.length - 1]);
    }, [rows]);

    return (
        <TableContainer component={Paper}>
            <Table sx={{ minWidth: 800,  tableLayout: 'fixed' }} aria-label="customized table" stickyHeader>
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
            </Table>
        </TableContainer>
    );
}

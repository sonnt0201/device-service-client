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
import { IReportPresetMsg } from '@/ipc-shared/IReportPresetMsg';
import { MsgTypeValue } from '@/ipc-shared/MessageType';

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

type BillRow = IEncodedLog | IReportPresetMsg;

const isPresetRow = (row: BillRow): row is IReportPresetMsg => {
    return row.message_type === MsgTypeValue.PRESET && "pre_cost" in row;
};

const getRowTypeLabel = (row: BillRow): string => {
    if (!isPresetRow(row)) return "Phiên bơm";

    if (row.pre_price > 0) return "Đổi đơn giá";
    if (row.pre_cost > 0) return "Đặt tiền";
    if (row.pre_volume > 0) return "Đặt lít";
    return "Đặt tiền";
};

const getRowValues = (row: BillRow) => {
    if (isPresetRow(row)) {
        return {
            cost: row.pre_cost,
            volume: row.pre_volume,
            price: row.pre_price,
        };
    }

    return {
        cost: row.cost,
        volume: row.volume,
        price: row.price,
    };
};

export default function BillsTable({ rows }: { rows: BillRow[] }) {

    useEffect(() => {
        // console.log("Row length in BillsTable: ", rows.length);
        // console.log("Rows in BillsTable: ", rows[rows.length - 1]);
    }, [rows]);

    return (
        <TableContainer
            component={Paper}
            sx={{
                height: 300,
                maxHeight: 300,
                overflowY: 'auto',
                overflowX: 'auto',
            }}
        >
            <Table sx={{ minWidth: 900, tableLayout: 'fixed' }} aria-label="customized table" stickyHeader>
                <TableHead>
                    <TableRow>
                        <StyledTableCell align="center"  sx={{ width: 80 }}>Device MAC</StyledTableCell>
                        <StyledTableCell align="center" sx={{ width: 160 }}>Thời gian</StyledTableCell>
                        <StyledTableCell align="center" sx={{ width: 80 }}>Phân loại</StyledTableCell>
                        <StyledTableCell align="center" sx={{ width: 80 }}>Số tiền</StyledTableCell>
                        <StyledTableCell align="center" sx={{ width: 40 }}>Lít</StyledTableCell>
                        <StyledTableCell align="center" sx={{ width: 80 }}>Đơn giá</StyledTableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {rows?.map((row: BillRow, index: number) => {
                        const rowValues = getRowValues(row);

                        return (
                        <StyledTableRow key={index}>
                            <StyledTableCell align="center" sx={{ maxWidth: 40, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {row.device_id}
                            </StyledTableCell>
                            <StyledTableCell align="center">
                                {dayjs(Number(row?.timestamp)).format("DD/MM/YYYY hh:mm:ss A")}
                            </StyledTableCell>
                            <StyledTableCell align="center" sx={{ width: 100 }}>
                                {getRowTypeLabel(row)}
                            </StyledTableCell>
                            <StyledTableCell align="center" sx={{ width: 80 }}>
                                {rowValues.cost}
                            </StyledTableCell>
                            <StyledTableCell align="center" sx={{ width: 60 }}>
                                {rowValues.volume}
                            </StyledTableCell>
                            <StyledTableCell align="center" sx={{ width: 80 }}>
                                {rowValues.price}
                            </StyledTableCell>
                        </StyledTableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </TableContainer>
    );
}

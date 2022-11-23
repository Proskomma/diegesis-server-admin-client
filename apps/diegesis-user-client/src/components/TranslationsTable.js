import {Paper, Table, TableBody, TableCell, TableContainer, TableRow} from "@mui/material";
import React from "react";

export default function TranslationsTable({columns, rows})
{
    return (
        <Paper sx={{width: '100%', overflow: 'hidden'}}>
            <TableContainer>
                <Table stickyHeader size="small" aria-label="sticky table">
                    <TableBody>
                        {rows
                            .map((row) => {
                                return (
                                    <TableRow hover role="checkbox" tabIndex={-1} key={row.id}>
                                        {columns.map((column) => {
                                            const value = row[column.id];
                                            return (
                                                <TableCell key={column.id} align={column.align}>
                                                    {
                                                        column.format &&
                                                        typeof value === 'boolean' &&
                                                        column.format(value)
                                                    }
                                                    {
                                                        !column.format && value
                                                    }
                                                </TableCell>
                                            );
                                        })}
                                    </TableRow>
                                );
                            })}
                    </TableBody>
                </Table>
            </TableContainer>
        </Paper>
    );
}

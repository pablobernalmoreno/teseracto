"use client";

import React from "react";
import { Badge, Box, IconButton, TextField, Tooltip, Typography } from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import "./SearchNavbarStyles.css";

interface SearchNavbarProps {
  value: string;
  onChange: (value: string) => void;
  matchCount: number;
  selectedCount: number;
  onDeleteClick: () => void;
}

export const SearchNavbar: React.FC<SearchNavbarProps> = ({
  value,
  onChange,
  matchCount,
  selectedCount,
  onDeleteClick,
}) => {
  const isDeleteDisabled = selectedCount === 0;

  return (
    <Box className="search_navbar_wrapper">
      <Box className="search_navbar_controls">
        <TextField
          fullWidth
          size="small"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          label="Buscar"
          placeholder="Buscar por título o descripción"
          aria-label="Buscar tarjetas por título o descripción"
        />
        <Tooltip title={isDeleteDisabled ? "Select cards to delete" : "Delete selected cards"}>
          <span>
            <IconButton
              aria-label={`Borrar ${selectedCount} tarjetas seleccionadas`}
              color="error"
              onClick={onDeleteClick}
              disabled={isDeleteDisabled}
            >
              <Badge badgeContent={selectedCount} color="error">
                <DeleteOutlineIcon />
              </Badge>
            </IconButton>
          </span>
        </Tooltip>
      </Box>
      <Typography variant="body2" className="search_navbar_count" aria-live="polite">
        {matchCount} result{matchCount === 1 ? "" : "s"}
      </Typography>
    </Box>
  );
};

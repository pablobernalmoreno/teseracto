"use client";

import React from "react";
import { Badge, Box, IconButton, TextField, Tooltip, Typography } from "@mui/material";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
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
          placeholder="Buscar por título"
          aria-label="Buscar planillas por título"
        />
        <Tooltip
          title={
            isDeleteDisabled
              ? "Selecciona planillas para eliminar"
              : "Eliminar planillas seleccionadas"
          }
        >
          <span>
            <IconButton
              aria-label={`Eliminar ${selectedCount} planillas seleccionadas`}
              color="error"
              onClick={onDeleteClick}
              disabled={isDeleteDisabled}
            >
              <Badge badgeContent={selectedCount} color="error">
                <DeleteOutlinedIcon />
              </Badge>
            </IconButton>
          </span>
        </Tooltip>
      </Box>
      <Typography variant="body2" className="search_navbar_count" aria-live="polite">
        {matchCount} resultado{matchCount === 1 ? "" : "s"}
      </Typography>
    </Box>
  );
};

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
  isSearching?: boolean;
}

export const SearchNavbar: React.FC<SearchNavbarProps> = ({
  value,
  onChange,
  matchCount,
  selectedCount,
  onDeleteClick,
  isSearching = false,
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
          placeholder="Search by title or description"
          aria-label="Search item cards"
        />
        <Tooltip title={isDeleteDisabled ? "Select cards to delete" : "Delete selected cards"}>
          <span>
            <IconButton
              aria-label="Delete selected cards"
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
      <Typography variant="body2" className="search_navbar_count">
        {matchCount} result{matchCount === 1 ? "" : "s"}
      </Typography>
    </Box>
  );
};

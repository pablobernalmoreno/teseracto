import React from "react";
import { Box, TextField, Typography } from "@mui/material";
import "./SearchNavbarStyles.css";

interface SearchNavbarProps {
  value: string;
  onChange: (value: string) => void;
  matchCount: number;
}

export const SearchNavbar: React.FC<SearchNavbarProps> = ({
  value,
  onChange,
  matchCount,
}) => {
  return (
    <Box className="search_navbar_wrapper">
      <TextField
        fullWidth
        size="small"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search by title or description"
        aria-label="Search item cards"
      />
      <Typography variant="body2" className="search_navbar_count">
        {matchCount} result{matchCount === 1 ? "" : "s"}
      </Typography>
    </Box>
  );
};

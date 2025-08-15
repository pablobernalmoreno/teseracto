import React from "react";
import { AppBarMenu } from "../components/appBarMenu/AppBarMenu";
import { Box, Paper, Typography } from "@mui/material";

const page = () => {
  return (
    <>
      <AppBarMenu isLogged />
      <Paper elevation={3} style={{ padding: "1rem" }}>
        <Typography variant="h4">Dashboard</Typography>
      </Paper>
      <Box
        style={{
          height: "100vh",
          width: "100vw",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#c9c9c9ff",
        }}
      >
        <Box
          sx={{
            width: "90%",
            height: "90%",
            backgroundColor: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "12px",
          }}
        >
          <Typography variant="h4">h4. Heading</Typography>
        </Box>
      </Box>
    </>
  );
};

export default page;

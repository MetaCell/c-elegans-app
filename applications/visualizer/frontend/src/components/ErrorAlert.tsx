import { Alert, AlertTitle, Box, Collapse } from "@mui/material";

const ErrorAlert = ({ open, setOpen, errorMessage }) => {
  return (
    <Collapse in={open}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          position: "fixed",
          top: "3rem",
          left: "50%",
          height: "fit-content",
          width: "100%",
          transform: "translate(-50%, -50%)",
          zIndex: 9999,
        }}
      >
        <Alert
          severity="error"
          onClose={() => setOpen(false)}
          sx={{
            height: "auto !important",
            padding: ".5rem 1rem !important",
            "& .MuiSvgIcon-root": {
              color: "#d32f2f",
              "&:hover": {
                backgroundColor: "transparent",
              },
            },
            "& .MuiAlert-action": {
              "& .MuiButtonBase-root": {
                "& .MuiSvgIcon-root": {
                  color: "#d32f2f",
                },
                "&:hover": {
                  backgroundColor: "transparent",
                },
              },
            },
          }}
        >
          <AlertTitle
            sx={{
              marginTop: "0",
              color: "#5f2120",
            }}
          >
            An error has occurred
          </AlertTitle>
          {errorMessage}
        </Alert>
      </Box>
    </Collapse>
  );
};

export default ErrorAlert;

import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { MainData } from "@/modules/dashboard/model/useItemCardModel";
import { CarouselValues, InvalidEntryCarousel } from "../InvalidEntryCarousel/InvalidEntryCarousel";
import { Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Fade } from "@mui/material";

export interface InputDialogProps {
  open: boolean;
  loader: boolean;
  successLoad: boolean;
  invalidEntries: MainData[];
  sources: string[];
  carouselIndex: number;
  carouselValues: CarouselValues;
  onClose: () => void;
  onSave: () => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPrev: () => void;
  onNext: () => void;
  onDateChange: (entryId: number, value: string) => void;
  onMoneyChange: (entryId: number, value: string) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onContentClick: () => void;
}

export const InputDialog: React.FC<InputDialogProps> = ({
  open,
  loader,
  successLoad,
  invalidEntries,
  sources,
  carouselIndex,
  carouselValues,
  onClose,
  onSave,
  onFileChange,
  onPrev,
  onNext,
  onDateChange,
  onMoneyChange,
  inputRef,
  onContentClick,
}) => {
  const allInvalidEntriesFilled = invalidEntries.every((entry) => {
    const v = carouselValues[entry.id] || { date: "", money: "" };
    return Boolean(v.date) && Boolean(v.money);
  });
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle id="alert-dialog-title">Subir Archivo</DialogTitle>
      <DialogContent
        className="file_upload_container"
        onClick={!loader && !successLoad ? onContentClick : undefined}
        style={{ cursor: !loader && !successLoad ? "pointer" : "default" }}
        sx={{ overflow: "visible" }}
      >
        {loader ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: 200,
            }}
          >
            <CircularProgress />
          </Box>
        ) : successLoad ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: 200,
              flexDirection: "column",
              gap: 2,
            }}
          >
            {invalidEntries.length ? (
              <InvalidEntryCarousel
                invalidEntries={invalidEntries}
                sources={sources}
                currentIndex={carouselIndex}
                carouselValues={carouselValues}
                onPrev={onPrev}
                onNext={onNext}
                onDateChange={onDateChange}
                onMoneyChange={onMoneyChange}
              />
            ) : (
              <Fade in={true} timeout={500}>
                <CheckCircleIcon style={{ fontSize: 80, color: "#4caf50" }} />
              </Fade>
            )}
          </Box>
        ) : (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
            }}
          >
            <input
              ref={inputRef}
              type="file"
              multiple
              accept="image/*,application/pdf"
              className="file_upload_hidden_input"
              onChange={onFileChange}
            />
            <Button
              role={undefined}
              variant="text"
              tabIndex={-1}
              startIcon={<CloudUploadIcon />}
            >
              Subir Archivos
            </Button>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          onClick={onSave}
          autoFocus
          disabled={loader || !successLoad || !allInvalidEntriesFilled}
        >
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

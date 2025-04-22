import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Box, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CircularProgress from "@mui/material/CircularProgress";

interface ImageLightboxProps {
  imageUrl: string;
  onClose: () => void;
}

const ImageLightbox: React.FC<ImageLightboxProps> = ({ imageUrl, onClose }) => {
  const [loading] = useState(true);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1300,
        cursor: "pointer",
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 25,
          duration: 0.3,
        }}
        style={{
          position: "relative",
          maxWidth: "90vw",
          maxHeight: "90vh",
          cursor: "default",
          backgroundColor: "#121212",
          padding: "8px",
          borderRadius: "4px",
          boxShadow: "0px 4px 20px rgba(0,0,0,0.5)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <IconButton
          aria-label="Cerrar lightbox"
          onClick={onClose}
          sx={{
            position: "absolute",
            top: -15,
            right: -15,
            zIndex: 1301,
            color: "white",
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            "&:hover": {
              backgroundColor: "rgba(0, 0, 0, 0.8)",
            },
            padding: "4px",
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>

        <Box
          sx={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "200px",
            width: "100%",
            height: "100%",
          }}
        >
          {loading && (
            <CircularProgress
              color="secondary"
              sx={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                zIndex: 5,
              }}
            />
          )}

          <motion.img
            key={imageUrl}
            src={imageUrl}
            alt="Comprobante"
            style={{
              display: loading ? "none" : "block",
              maxWidth: "100%",
              maxHeight: "calc(90vh - 16px)",
              objectFit: "contain",
              borderRadius: "2px",
            }}
          />
        </Box>
      </motion.div>
    </motion.div>
  );
};

export default ImageLightbox;

import React, { useState } from "react";
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { m } from "motion/react";

const faqData = [
  {
    id: "faq1",
    title: "¿Qué es la FEUCSC y cómo se financia?",
    content:
      "La FEUCSC (Federación de Estudiantes de la Universidad Católica de la Santísima Concepción) es el órgano estudiantil que representa a todas y todos los estudiantes de la UCSC. Nos financiamos principalmente a través de los fondos federativos que la universidad nos entrega.",
  },
  {
    id: "faq2",
    title: "¿Con qué frecuencia actualizan la información?",
    content:
      "La información se actualiza a medida que realizamos gastos o recibimos nuevos ingresos, los cuales ingresamos a la página.",
  },
  {
    id: "faq3",
    title: "¿Por qué los ingresos son mayores que los egresos?",
    content:
      "Esto se debe a que los ingresos que mostramos en esta página corresponden únicamente al dinero directo que ingresa a nuestra cuenta bancaria federativa, y no a nuestro presupuesto total. En ocasiones, la universidad realiza pagos directos por bienes o servicios que contratamos, por lo que el dinero no pasa directamente por nuestra cuenta, sino que es una transacción entre la universidad y el proveedor.",
  },
  {
    id: "faq4",
    title: "¿Qué debo hacer si encuentro un error o tengo alguna duda?",
    content:
      "Puedes contactarnos a través de nuestro Instagram, cuyo enlace se encuentra al final de esta página, o visitarnos en nuestra sala FEUCSC ubicada en el campus San Andrés.",
  },
];

function FaqSection() {
  const [expandedFAQ, setExpandedFAQ] = useState<string | false>(false);

  const handleFAQChange =
    (panel: string) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
      setExpandedFAQ(isExpanded ? panel : false);
    };

  return (
    <Box sx={{ mt: 24, mb: 18, color: "white" }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          mb: 4,
        }}
      >
        <HelpOutlineIcon sx={{ color: "#a855f7", fontSize: "2.5rem", mb: 1 }} />
        <Typography variant="h5" component="h2" sx={{ fontWeight: "bold" }}>
          Preguntas Frecuentes
        </Typography>
      </Box>
      <Box sx={{ maxWidth: "800px", mx: "auto" }}>
        {faqData.map((item) => (
          <m.div
            key={`${item.id}-motion`}
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.99 }}
            transition={{ duration: 0.2 }}
            style={{
              marginBottom: expandedFAQ === item.id ? "24px" : "12px",
            }}
          >
            <Accordion
              expanded={expandedFAQ === item.id}
              onChange={handleFAQChange(item.id)}
              sx={{
                backgroundColor: "#1e1e1e",
                color: "white",
                border: "1px solid #444",
                "&:before": { display: "none" },
                borderRadius: "8px",
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon sx={{ color: "grey.500" }} />}
                aria-controls={`${item.id}-content`}
                id={`${item.id}-header`}
                sx={{
                  "& .MuiAccordionSummary-content": {
                    color: "grey.200",
                    fontWeight: "medium",
                  },
                  py: 1,
                }}
              >
                <Typography>{item.title}</Typography>
              </AccordionSummary>
              <AccordionDetails
                sx={{
                  borderTop: "1px solid #444",
                  color: "grey.400",
                  py: 2,
                  px: 2,
                }}
              >
                <Typography variant="body2">{item.content}</Typography>
              </AccordionDetails>
            </Accordion>
          </m.div>
        ))}
      </Box>
    </Box>
  );
}

export default FaqSection;

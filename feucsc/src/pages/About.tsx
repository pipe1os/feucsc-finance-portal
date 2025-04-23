import { Box, Typography, Container, Link, Paper, Grid } from '@mui/material';
import GitHubIcon from '@mui/icons-material/GitHub';

const About = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Paper
        elevation={3}
        sx={{
          p: 4,
          backgroundColor: '#1e1e1e',
          color: 'white',
          borderRadius: '12px'
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom sx={{ color: '#a855f7', fontWeight: 'bold', fontFamily: 'Roboto'}}>
          Acerca de la FEUCSC
        </Typography>

        <Typography variant="body1" sx={{ mb: 2 }}>
          La Federación de Estudiantes de la Universidad Católica de la Santísima Concepción (FEUCSC)
          es el organismo representativo de todas y todos los estudiantes de la universidad. Nuestro objetivo
          principal es velar por los intereses y necesidades de la comunidad estudiantil.
        </Typography>

        <Typography variant="body1" sx={{ mb: 2 }}>
          Este proyecto fue desarrollado para proporcionar transparencia en la gestión financiera
          de la federación, permitiendo a todos los estudiantes acceder a información detallada
          sobre ingresos y egresos.
        </Typography>

        <Box sx={{ mt: 4, mb: 2 }}>
          <Typography variant="h5" gutterBottom sx={{ color: '#a855f7', fontWeight: 'bold', fontFamily: 'Roboto' }}>
            Objetivos del Proyecto
          </Typography>

          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid sx={{ gridColumn: { xs: 'span 12', md: 'span 4' } }}>
              <Box sx={{ p: 2, border: '1px solid #333', borderRadius: '8px', height: '100%' }}>
                <Typography variant="h6" gutterBottom sx={{ color: '#a855f7', fontWeight: 'bold', fontFamily: 'Roboto' }}>
                  Transparencia
                </Typography>
                <Typography variant="body2">
                  Proporcionar acceso claro y directo a la información financiera de la federación.
                </Typography>
              </Box>
            </Grid>

            <Grid sx={{ gridColumn: { xs: 'span 12', md: 'span 4' } }}>
              <Box sx={{ p: 2, border: '1px solid #333', borderRadius: '8px', height: '100%' }}>
                <Typography variant="h6" gutterBottom sx={{ color: '#a855f7', fontWeight: 'bold', fontFamily: 'Roboto' }}>
                  Accesibilidad
                </Typography>
                <Typography variant="body2">
                  Facilitar el acceso a la información desde cualquier dispositivo y en cualquier momento.
                </Typography>
              </Box>
            </Grid>

            <Grid sx={{ gridColumn: { xs: 'span 12', md: 'span 4' } }}>
              <Box sx={{ p: 2, border: '1px solid #333', borderRadius: '8px', height: '100%' }}>
                <Typography variant="h6" gutterBottom sx={{ color: '#a855f7', fontWeight: 'bold', fontFamily: 'Roboto' }}>
                  Rendición de Cuentas
                </Typography>
                <Typography variant="body2">
                  Promover una cultura de responsabilidad y rendición de cuentas en la gestión federativa.
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ color: '#a855f7', fontWeight: 'bold', fontFamily: 'Roboto' }}>
            ¿Eres desarrollador? Revisa el Repositorio del Proyecto
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
            <GitHubIcon sx={{ mr: 1, color: 'white' }} />
            <Link
              href="https://github.com/pipe1os/feucsc-finance-portal"
              target="_blank"
              rel="noopener noreferrer"
              sx={{ color: '#a855f7', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
            >
              Visita el Repositorio
            </Link>
          </Box>

          <Typography variant="body2" sx={{ mt: 2, color: 'gray' }}>
            Este proyecto es de código abierto. Puedes reportar problemas a través del repositorio de GitHub.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default About;

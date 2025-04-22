import "./App.css";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import {
  useMotionValue,
  animate,
  useTransform,
  AnimatePresence,
  useScroll,
  useMotionValueEvent,
  LazyMotion,
  domAnimation,
  m,
} from "motion/react";
import logoUCSC from "./assets/logo-ucsc.webp";
import {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
  lazy,
  Suspense,
} from "react";
import ImageLightbox from "./components/ImageLightbox";

import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  Navigate,
  useLocation,
} from "react-router-dom";
import AdminPanel from "./pages/AdminPanel";

import { getDb, getAuthInstance } from "./lib/firebase";
import { type Timestamp } from "firebase/firestore";
import { User } from "firebase/auth";

import {
  TextField,
  InputAdornment,
  Typography,
  Box,
  CircularProgress,
  IconButton,
  Container,
  Skeleton,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import KeyOutlinedIcon from "@mui/icons-material/KeyOutlined";
import LogoutIcon from "@mui/icons-material/Logout";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import InstagramIcon from "@mui/icons-material/Instagram";

interface Transaction {
  id: string;
  addedBy: string;
  amount: number;
  createdAt: Timestamp;
  date: Timestamp;
  description: string;
  isDateApproximate: boolean;
  receiptNumber: string;
  receiptUrl: string;
  type: "ingreso" | "egreso";
}

const LazyFaqSection = lazy(() => import("./components/FaqSection"));

const LazyTransactionView = lazy(() => import("./components/TransactionView"));

function AppContent() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [mainTab, setMainTab] = useState(0);
  const [monthFilter, setMonthFilter] = useState("Todos");
  const [orderBy, setOrderBy] = useState<"fecha" | "nBoleta">("fecha");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [targetReceiptNumber, setTargetReceiptNumber] = useState<string | null>(
    null,
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lightboxImageUrl, setLightboxImageUrl] = useState<string | null>(null);
  const highlightClearTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      setError(null);
      try {
        const firestoreDb = await getDb();
        const { collection, getDocs, query, orderBy } = await import(
          "firebase/firestore"
        );
        const transactionsQuery = query(
          collection(firestoreDb, "transactions"),
          orderBy("date", "desc"),
        );
        const querySnapshot = await getDocs(transactionsQuery);
        const fetchedTransactions: Transaction[] = querySnapshot.docs.map(
          (doc) => ({
            id: doc.id,
            ...(doc.data() as Omit<Transaction, "id">),
          }),
        );
        setTransactions(fetchedTransactions);
      } catch (err) {
        console.error("Error fetching transactions:", err);
        setError("Error al cargar las transacciones.");
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  const [totalIngresos, totalEgresos] = useMemo(() => {
    let ingresosSum = 0;
    let egresosSum = 0;
    transactions.forEach((tx) => {
      if (tx.type === "ingreso") {
        ingresosSum += tx.amount;
      } else if (tx.type === "egreso") {
        egresosSum += tx.amount;
      }
    });
    return [ingresosSum, egresosSum];
  }, [transactions]);

  const incomeMotionValue = useMotionValue(0);
  const expenseMotionValue = useMotionValue(0);

  const formattedIncome = useTransform(
    incomeMotionValue,
    (latest) => `$${new Intl.NumberFormat("es-CL").format(Math.round(latest))}`,
  );
  const formattedExpense = useTransform(
    expenseMotionValue,
    (latest) => `$${new Intl.NumberFormat("es-CL").format(Math.round(latest))}`,
  );

  useEffect(() => {
    const currentIncome = incomeMotionValue.get();
    if (!loading && totalIngresos > 0 && totalIngresos !== currentIncome) {
      const incomeControls = animate(incomeMotionValue, totalIngresos, {
        duration: 1.5,
        ease: "easeOut",
      });
      return () => {
        incomeControls.stop();
      };
    }
  }, [totalIngresos, loading]);

  useEffect(() => {
    const currentExpense = expenseMotionValue.get();
    if (!loading && totalEgresos > 0 && totalEgresos !== currentExpense) {
      const expenseControls = animate(expenseMotionValue, totalEgresos, {
        duration: 1.5,
        ease: "easeOut",
      });
      return () => {
        expenseControls.stop();
      };
    }
  }, [totalEgresos, loading]);

  const clearHighlight = useCallback(() => {
    if (highlightClearTimerRef.current) {
      clearTimeout(highlightClearTimerRef.current);
      highlightClearTimerRef.current = null;
    }
    setTargetReceiptNumber(null);
  }, [highlightClearTimerRef, setTargetReceiptNumber]);

  const handleMainTabChange = useCallback(
    (_event: React.SyntheticEvent, newValue: number) => {
      setMainTab(newValue);
      setPage(0);
      clearHighlight();
    },
    [clearHighlight],
  );

  const handleMonthFilterChange = useCallback(
    (month: string) => {
      setMonthFilter(month);
      setPage(0);
      clearHighlight();
    },
    [clearHighlight],
  );

  const handleSortRequest = useCallback(
    (property: "fecha" | "nBoleta") => {
      const isAsc = orderBy === property && sortOrder === "asc";
      setSortOrder(isAsc ? "desc" : "asc");
      setOrderBy(property);
      setPage(0);
      clearHighlight();
    },
    [orderBy, sortOrder, clearHighlight],
  );

  const handleChangePage = useCallback(
    (_event: unknown, newPage: number) => {
      setPage(newPage);
      clearHighlight();
    },
    [clearHighlight],
  );

  const handleChangeRowsPerPage = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setRowsPerPage(parseInt(event.target.value, 10));
      setPage(0);
      clearHighlight();
    },
    [clearHighlight],
  );

  const handleVerComprobante = useCallback(
    (receiptNumber: string | null | undefined) => {
      if (!receiptNumber) return;

      clearHighlight();

      const comprobantesForSearch = transactions
        .filter(
          (tx) => tx.receiptUrl && tx.receiptUrl !== "#" && tx.receiptNumber,
        )
        .sort((a, b) => b.date.toMillis() - a.date.toMillis());
      const foundIndex = comprobantesForSearch.findIndex(
        (tx) => tx.receiptNumber === receiptNumber,
      );
      if (foundIndex !== -1) {
      } else {
        console.warn(
          `handleVerComprobante: No se encontró ${receiptNumber} en comprobantesData`,
        );
        return;
      }

      setTargetReceiptNumber(receiptNumber);
      setMainTab(2);
      const targetPageCalc = Math.floor(foundIndex / rowsPerPage);
      setPage(targetPageCalc);
      console.log(`handleVerComprobante: Setting page to ${targetPageCalc}`);

      highlightClearTimerRef.current = setTimeout(() => {
        setTargetReceiptNumber(null);
        highlightClearTimerRef.current = null;
      }, 1500);
    },
    [
      transactions,
      clearHighlight,
      highlightClearTimerRef,
      setTargetReceiptNumber,
      mainTab,
      page,
      rowsPerPage,
    ],
  );

  useEffect(() => {
    if (!targetReceiptNumber) return;

    const elementId = `comprobante-${targetReceiptNumber}`;
    const targetElement = document.getElementById(elementId);

    if (targetElement) {
      const scrollTimerId = setTimeout(() => {
        targetElement.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
      return () => clearTimeout(scrollTimerId);
    } else {
      console.warn(
        `Scroll Effect: Element ${elementId} existe en datos pero no en DOM?`,
      );
    }
  }, [
    targetReceiptNumber,
    mainTab,
    page,
    rowsPerPage,
    transactions,
    monthFilter,
    orderBy,
    sortOrder,
  ]);

  return (
    <div className="mx-auto flex w-full max-w-[1580px] flex-col gap-6 px-4 pt-12 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 md:flex-row">
        <div className="flex-1">
          <Card
            className="w-full overflow-hidden p-4 text-white shadow-lg"
            sx={{ backgroundColor: "#1e1e1e", borderRadius: "12px" }}
          >
            <CardContent className="p-5">
              <div className="mb-8 flex items-center justify-between">
                <span className="text-lg font-semibold tracking-wider text-gray-400 uppercase">
                  INGRESOS TOTALES
                </span>
              </div>
              <m.p className="mb-5 text-4xl font-bold text-green-500">
                {formattedIncome}
              </m.p>
              <div className="h-1.5 rounded-full bg-green-500"></div>
            </CardContent>
          </Card>
        </div>
        <div className="flex-1">
          <Card
            className="w-full overflow-hidden p-4 text-white shadow-lg"
            sx={{ backgroundColor: "#1e1e1e", borderRadius: "12px" }}
          >
            <CardContent className="p-5">
              <div className="mb-8 flex items-center justify-between">
                <span className="text-lg font-semibold tracking-wider text-gray-400 uppercase">
                  EGRESOS TOTALES
                </span>
              </div>
              <m.p className="mb-5 text-4xl font-bold text-pink-500">
                {formattedExpense}
              </m.p>
              <div className="h-1.5 rounded-full bg-pink-500"></div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div>
        <Card
          className="w-full overflow-hidden shadow-lg"
          sx={{
            backgroundColor: "#1e1e1e",
            color: "white",
            padding: "16px",
            borderRadius: "12px",
          }}
        >
          <CardContent className="space-y-6 p-5">
            <Box>
              <TextField
                placeholder="Buscar en tabla actual por descripción..."
                variant="outlined"
                fullWidth
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: "grey.500" }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  backgroundColor: "#2a2a2a",
                  borderRadius: "4px",
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": { borderColor: "#444" },
                    "&:hover fieldset": { borderColor: "#666" },
                    "&.Mui-focused fieldset": { borderColor: "#a855f7" },
                    color: "white",
                  },
                  "& .MuiInputBase-input": {
                    color: "white",
                  },
                }}
              />
            </Box>
            <Suspense
              fallback={
                <Box sx={{ mt: 2 }}>
                  <Skeleton
                    variant="rectangular"
                    height={40}
                    sx={{ bgcolor: "grey.800", mb: 2 }}
                  />
                  <Skeleton
                    variant="rectangular"
                    height={30}
                    width="80%"
                    sx={{ bgcolor: "grey.800", mb: 4 }}
                  />
                  <Skeleton
                    variant="rectangular"
                    height={300}
                    sx={{ bgcolor: "grey.800" }}
                  />
                </Box>
              }
            >
              <LazyTransactionView
                transactions={transactions}
                loading={loading}
                error={error}
                handleVerComprobante={handleVerComprobante}
                setLightboxImageUrl={setLightboxImageUrl}
                targetReceiptNumber={targetReceiptNumber}
                mainTab={mainTab}
                page={page}
                rowsPerPage={rowsPerPage}
                monthFilter={monthFilter}
                orderBy={orderBy}
                sortOrder={sortOrder}
                onMainTabChange={handleMainTabChange}
                onMonthFilterChange={handleMonthFilterChange}
                onSortRequest={handleSortRequest}
                onChangePage={handleChangePage}
                onChangeRowsPerPage={handleChangeRowsPerPage}
              />
            </Suspense>
          </CardContent>
        </Card>
      </div>

      <Suspense
        fallback={
          <Box
            sx={{
              height: "300px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <CircularProgress color="secondary" />
          </Box>
        }
      >
        <LazyFaqSection />
      </Suspense>

      <AnimatePresence>
        {lightboxImageUrl && (
          <ImageLightbox
            imageUrl={lightboxImageUrl}
            onClose={() => setLightboxImageUrl(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

interface LayoutProps {
  user: User | null;
  isAdmin: boolean;
  handleLogin: () => Promise<void>;
  handleLogout: () => Promise<void>;
}

function Layout({ user, isAdmin, handleLogin, handleLogout }: LayoutProps) {
  const location = useLocation();
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() ?? 0;
    const diff = latest - previous;

    if (latest > 50 && diff > 5) {
      setHidden(true);
    } else if (diff < -5 || latest <= 50) {
      setHidden(false);
    }
  });

  const headerVariants = {
    visible: { y: 0, opacity: 1 },
    hidden: { y: "-100%", opacity: 0.8 },
  };

  return (
    <Box className="flex min-h-screen flex-col bg-[#121212]">
      <m.header
        className="fixed top-0 right-0 left-0 z-50 border-b-2 border-[#2a2a2a] bg-[#1e1e1e] shadow-md"
        variants={headerVariants}
        initial={{ y: "-100%", opacity: 0 }}
        animate={hidden ? "hidden" : "visible"}
        transition={{ duration: 0.5, ease: "backOut" }}
      >
        <div className="mx-auto flex h-23 max-w-[1585px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <img
              src="/logo-federacion.webp"
              alt="Logo Federación FEUCSC"
              className="size-17"
            />
          </div>
          <div>
            {location.pathname === "/admin" && (
              <IconButton
                component={Link}
                to="/"
                title="Volver a Inicio"
                sx={{
                  color: "grey.500",
                  mr: 1,
                  "&:hover": { bgcolor: "rgba(255, 255, 255, 0.08)" },
                }}
              >
                <HomeOutlinedIcon />
              </IconButton>
            )}
            {user && isAdmin && (
              <IconButton
                component={Link}
                to="/admin"
                title="Panel Admin"
                sx={{
                  color: "grey.500",
                  mr: 1,
                  "&:hover": { bgcolor: "rgba(255, 255, 255, 0.08)" },
                }}
              >
                <ManageAccountsIcon />
              </IconButton>
            )}
            {user && (
              <IconButton
                onClick={handleLogout}
                title="Cerrar sesión"
                sx={{
                  color: "grey.500",
                  "&:hover": { bgcolor: "rgba(255, 255, 255, 0.08)" },
                }}
              >
                <LogoutIcon />
              </IconButton>
            )}
          </div>
        </div>
      </m.header>

      <main className="flex-grow pt-[92px]">
        <AppRoutes isAdmin={isAdmin} />
      </main>

      <Box
        component="footer"
        sx={{
          py: 2,
          px: 2,
          backgroundColor: "#1e1e1e",
          borderTop: "1px solid #2a2a2a",
        }}
      >
        <Container
          maxWidth="lg"
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 1,
            "@media (max-width:600px)": { justifyContent: "center" },
          }}
        >
          <Typography variant="body2" color="grey.500">
            2025 - Federación de Estudiantes UCSC
          </Typography>

          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <IconButton
              component="a"
              href="https://www.instagram.com/feucsc_/"
              target="_blank"
              rel="noopener noreferrer"
              title="Instagram FEUCSC"
              sx={{
                color: "grey.500",
                "&:hover": { bgcolor: "rgba(255, 255, 255, 0.08)" },
              }}
            >
              <InstagramIcon />
            </IconButton>

            <img
              src={logoUCSC}
              alt="Logo UCSC"
              style={{ height: "35px", width: "auto", display: "block" }}
            />

            {!user && (
              <IconButton
                onClick={handleLogin}
                title="Iniciar sesión (Admin)"
                sx={{
                  color: "grey.500",
                  "&:hover": { bgcolor: "rgba(255, 255, 255, 0.08)" },
                }}
              >
                <KeyOutlinedIcon />
              </IconButton>
            )}
          </Box>
        </Container>
      </Box>
    </Box>
  );
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const setupAuthListener = async () => {
      try {
        const authInstance = await getAuthInstance();
        const { onAuthStateChanged } = await import("firebase/auth");

        unsubscribe = onAuthStateChanged(authInstance, async (currentUser) => {
          setUser(currentUser);
          if (currentUser) {
            const { doc, getDoc } = await import("firebase/firestore");
            const firestoreDb = await getDb();
            try {
              const adminRef = doc(
                firestoreDb,
                "administrators",
                currentUser.email!,
              );
              const adminSnap = await getDoc(adminRef);
              setIsAdmin(adminSnap.exists());
            } catch (err) {
              console.error("Error verificando admin:", err);
              setIsAdmin(false);
            }
          } else {
            setIsAdmin(false);
          }
          setAuthLoading(false);
        });
      } catch (error) {
        console.error("Error setting up auth listener:", error);
        setIsAdmin(false);
        setAuthLoading(false);
      }
    };

    setupAuthListener();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const handleLogin = async () => {
    try {
      const authInstance = await getAuthInstance();
      const { GoogleAuthProvider, signInWithPopup } = await import(
        "firebase/auth"
      );
      const provider = new GoogleAuthProvider();
      await signInWithPopup(authInstance, provider);
    } catch (error) {
      console.error("Error durante el login:", error);
    }
  };

  const handleLogout = async () => {
    try {
      const authInstance = await getAuthInstance();
      const { signOut } = await import("firebase/auth");
      await signOut(authInstance);
    } catch (error) {
      console.error("Error durante el logout:", error);
    }
  };

  if (authLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          bgcolor: "#121212",
        }}
      >
        <CircularProgress color="secondary" />
      </Box>
    );
  }

  return (
    <BrowserRouter>
      <LazyMotion features={domAnimation}>
        <Layout
          user={user}
          isAdmin={isAdmin}
          handleLogin={handleLogin}
          handleLogout={handleLogout}
        />
      </LazyMotion>
    </BrowserRouter>
  );
}

function AppRoutes({ isAdmin }: { isAdmin: boolean }) {
  return (
    <Routes>
      <Route path="/" element={<AppContent />} />
      <Route
        path="/admin"
        element={isAdmin ? <AdminPanel /> : <Navigate to="/" replace />}
      />
    </Routes>
  );
}

export default App;

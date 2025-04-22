// Eliminar importaciones estáticas de db y storage
// import { db, storage } from "./firebase";
import { type Timestamp } from "firebase/firestore"; // Mantener tipo
// Importar getters
import { getDb, getStorageInstance } from "./firebase";

interface AddTransactionData {
  type: "ingreso" | "egreso";
  date: Timestamp; // Already constructed timestamp
  description: string;
  amount: number; // Already parsed number
  isApproximate: boolean;
  receiptFile: File | null;
  addedByEmail: string; // Email of the admin adding the transaction
}

export const addTransaction = async ({
  type,
  date,
  description,
  amount,
  isApproximate,
  receiptFile,
  addedByEmail,
}: AddTransactionData): Promise<string> => {
  // 1. Validate essential data (basic check)
  if (!type || !date || !description || isNaN(amount) || !addedByEmail) {
    throw new Error("Faltan datos esenciales para agregar la transacción.");
  }

  // Obtener db instance al inicio de la lógica principal
  const firestoreDb = await getDb();
  const { doc, runTransaction } = await import("firebase/firestore");

  const counterRef = doc(firestoreDb, "counters", "transactionCounter"); // Usar firestoreDb
  let newReceiptNumberStr = "";
  let receiptUrl = "";

  try {
    // 2. Run a Firestore transaction to get and update the counter
    await runTransaction(firestoreDb, async (transaction) => {
      const counterDoc = await transaction.get(counterRef);
      if (!counterDoc.exists()) {
        // If counter doesn't exist, maybe initialize it? Or throw error.
        // For now, let's assume it must exist and throw an error.
        console.error("Counter document 'transactionCounter' does not exist!");
        throw new Error(
          "El contador de comprobantes no existe. Contacta al administrador.",
        );
      }

      const currentNumber = counterDoc.data()?.currentNumber ?? 0;
      const newNumber = currentNumber + 1;
      newReceiptNumberStr = `N°${newNumber}`; // Format the receipt number

      // Update the counter in the transaction
      transaction.update(counterRef, { currentNumber: newNumber });
      console.log(
        `Número de comprobante obtenido y actualizado: ${newReceiptNumberStr}`,
      );
    });

    if (receiptFile) {
      // Obtener storage instance si hay archivo
      const storage = await getStorageInstance();
      const { ref, uploadBytesResumable, getDownloadURL } = await import(
        "firebase/storage"
      );

      console.log("Subiendo archivo de comprobante...");
      const fileName = `${newReceiptNumberStr}-${receiptFile.name}`;
      const storagePath = `${fileName}`;
      const storageRef = ref(storage, storagePath); // Usar storage

      const uploadTask = uploadBytesResumable(storageRef, receiptFile);

      await new Promise<void>((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const progress =
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log("Upload is " + progress + "% done");
          },
          (error) => {
            console.error("Error en subida:", error);
            reject(new Error(`Error al subir archivo: ${error.code}`));
          },
          async () => {
            try {
              receiptUrl = await getDownloadURL(uploadTask.snapshot.ref);
              console.log("Archivo subido y URL obtenida:", receiptUrl);
              resolve();
            } catch (getUrlError) {
              console.error("Error obteniendo URL de descarga:", getUrlError);
              reject(
                new Error(`Error al obtener URL de descarga: ${getUrlError}`),
              );
            }
          },
        );
      });
    }

    // addDoc necesita la instancia db, que ya tenemos en firestoreDb
    const { collection, addDoc, serverTimestamp } = await import(
      "firebase/firestore"
    );

    const newTransactionData = {
      type,
      date,
      description,
      amount,
      isDateApproximate: isApproximate,
      receiptNumber: newReceiptNumberStr,
      receiptUrl: receiptUrl || "#",
      addedBy: addedByEmail,
      createdAt: serverTimestamp(),
    };

    console.log("Añadiendo documento a Firestore:", newTransactionData);
    const docRef = await addDoc(
      collection(firestoreDb, "transactions"), // Usar firestoreDb
      newTransactionData,
    );
    console.log("Transacción añadida con ID:", docRef.id);

    return docRef.id;
  } catch (error) {
    console.error("Error detallado en addTransaction:", error);
    if (error instanceof Error) {
      throw new Error(`Error al agregar transacción: ${error.message}`);
    } else {
      throw new Error("Error desconocido al agregar transacción.");
    }
  }
};

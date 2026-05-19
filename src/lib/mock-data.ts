import { InventoryRecordsInput } from "@/ai/flows/automated-inventory-insight-flow";

export const INITIAL_RECORDS: InventoryRecordsInput["records"] = [
  {
    date: "2024-05-15",
    time: "09:30",
    name: "John Doe",
    age: 45,
    gender: "Male",
    department: "Cardiology",
    chiefComplaints: "Chest pain and shortness of breath",
    medicineTaken: [
      { name: "Aspirin", quantity: 1, dosage: "300mg" },
      { name: "Nitroglycerin", quantity: 2, dosage: "0.4mg" }
    ]
  },
  {
    date: "2024-05-15",
    time: "10:15",
    name: "Jane Smith",
    age: 32,
    gender: "Female",
    department: "Pediatrics",
    chiefComplaints: "Seasonal allergies and sneezing",
    medicineTaken: [
      { name: "Cetirizine", quantity: 10, dosage: "10mg" }
    ]
  },
  {
    date: "2024-05-15",
    time: "11:00",
    name: "Robert Brown",
    age: 68,
    gender: "Male",
    department: "General Medicine",
    chiefComplaints: "Joint pain and stiffness in knees",
    medicineTaken: [
      { name: "Ibuprofen", quantity: 20, dosage: "400mg" },
      { name: "Paracetamol", quantity: 10, dosage: "500mg" }
    ]
  },
  {
    date: "2024-05-16",
    time: "08:45",
    name: "Alice Wilson",
    age: 28,
    gender: "Female",
    department: "Dermatology",
    chiefComplaints: "Skin rash and itching",
    medicineTaken: [
      { name: "Hydrocortisone Cream", quantity: 1, dosage: "1%" }
    ]
  }
];

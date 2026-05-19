
import { InventoryRecordsInput } from "@/ai/flows/automated-inventory-insight-flow";

export const INITIAL_RECORDS: InventoryRecordsInput["records"] = [
  {
    date: "2024-05-15",
    time: "09:30",
    name: "John Doe",
    age: 28,
    gender: "Male",
    department: "Sales",
    chiefComplaints: "Headache due to long calls",
    medicineTaken: [
      { name: "Paracetamol", quantity: 1, dosage: "500mg" }
    ]
  },
  {
    date: "2024-05-15",
    time: "10:15",
    name: "Jane Smith",
    age: 24,
    gender: "Female",
    department: "Customer Support",
    chiefComplaints: "Sore throat from continuous talking",
    medicineTaken: [
      { name: "Lozenges", quantity: 2, dosage: "Standard" }
    ]
  },
  {
    date: "2024-05-15",
    time: "11:00",
    name: "Robert Brown",
    age: 35,
    gender: "Male",
    department: "IT Support",
    chiefComplaints: "Back pain from long sitting hours",
    medicineTaken: [
      { name: "Ibuprofen", quantity: 1, dosage: "400mg" }
    ]
  },
  {
    date: "2024-05-16",
    time: "08:45",
    name: "Alice Wilson",
    age: 22,
    gender: "Female",
    department: "Operations",
    chiefComplaints: "Eye strain",
    medicineTaken: [
      { name: "Eye Drops", quantity: 1, dosage: "Standard" }
    ]
  }
];

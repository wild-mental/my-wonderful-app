export type BadgeStatus = "APPROVED" | "CAUTION" | "NOT_APPROVED" | "UNREGISTERED";

export interface Ingredient {
  name: string;
  amount: string;
  status: BadgeStatus;
  evidence: string;
}

export interface Product {
  id: number;
  image: string;
  brand: string;
  name: string;
  servingSize: string;
  dailyCost: number;
  finalPrice: number;
  packageInfo: string;
  ingredients: Ingredient[];
}

export interface RegistrationRequest {
  id: number;
  ingredientName: string;
  email: string;
  requestDate: string;
  status: "pending" | "approved" | "rejected";
}

export interface ErrorReport {
  id: number;
  productName: string;
  productId: string;
  errorType: string;
  description: string;
  email: string;
  reportDate: string;
  status: "pending" | "resolved";
}

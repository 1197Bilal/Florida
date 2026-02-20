import { Product } from "../types/pos";

export const PRODUCTS: Product[] = [
    // BEBIDAS CALIENTES
    { name: "Café Solo", price: 10.00, image: "cafe-solo-v2.jpg", color: "border-amber-900" },
    { name: "Café con Leche", price: 12.00, image: "cafe-con-leche.jpg", color: "border-amber-600" },
    { name: "Té Verde (Vaso)", price: 10.00, image: "te-verde-v2.jpg", color: "border-emerald-600" },
    { name: "Barrad de Té", price: 25.00, image: "te-barrad-v2.jpg", color: "border-slate-400" },

    // BEBIDAS FRÍAS
    { name: "Zumo Naranja", price: 15.00, image: "zumo-naranja-v2.jpg", color: "border-orange-400" },
    { name: "Batidos", price: 25.00, image: "https://images.pexels.com/photos/103566/pexels-photo-103566.jpeg?auto=compress&cs=tinysrgb&w=600", color: "border-green-400" },
    { name: "Refrescos", price: 15.00, image: "refresco.jpg", color: "border-red-500" },

    // PARA PICAR / DESAYUNO
    { name: "Khobza", price: 5.00, image: "khobza.jpg", color: "border-amber-200" },
    { name: "Msemen", price: 10.00, image: "msemen-v2.jpg", color: "border-yellow-600" },
    { name: "Croissant", price: 10.00, image: "https://images.pexels.com/photos/3892469/pexels-photo-3892469.jpeg?auto=compress&cs=tinysrgb&w=600", color: "border-yellow-500" },
    { name: "Huevos", price: 15.00, image: "huevos-v2.jpg", color: "border-yellow-300" },
];


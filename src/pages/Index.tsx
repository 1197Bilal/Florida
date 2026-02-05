import React, { useState } from "react";

export default function Index() {
  const [carrito, setCarrito] = useState<{nombre: string, precio: number, id: number}[]>([]);
  
  const total = carrito.reduce((acc, item) => acc + item.precio, 0);

  const agregar = (nombre: string, precio: number) => {
    setCarrito([...carrito, { nombre, precio, id: Date.now() }]);
  };

  // NUEVO: Función para eliminar solo un producto de la lista
  const eliminarUno = (id: number) => {
    setCarrito(carrito.filter(item => item.id !== id));
  };

  const borrarTodo = () => setCarrito([]);

  const productos = [
    { nombre: "Café Solo", precio: 1.50, imagen: "https://i.ibb.co/L6vV0rM/cafe.png", color: "border-amber-700" },
    { nombre: "Café con Leche", precio: 1.80, imagen: "https://i.ibb.co/L6vV0rM/cafe.png", color: "border-amber-500" },
    { nombre: "Barrad de Té", precio: 3.50, imagen: "https://i.ibb.co/p3Yf1zQ/te.png", color: "border-green-700" },
    { nombre: "Té con Menta", precio: 1.50, imagen: "https://i.ibb.co/p3Yf1zQ/te.png", color: "border-green-400" },
    { nombre: "Msemen", precio: 2.00, imagen: "https://i.ibb.co/Xz9W3Ym/msemen.png", color: "border-orange-500" },
    { nombre: "Khobza", precio: 1.00, imagen: "https://i.ibb.co/Xz9W3Ym/pan.png", color: "border-yellow-600" },
    { nombre: "Batido", precio: 3.00, imagen: "https://i.ibb.co/p3Yf1zQ/batido.png", color: "border-pink-400" },
    { nombre: "Croissant", precio: 1.50, imagen: "https://i.ibb.co/Xz9W3Ym/croissant.png", color: "border-orange-300" },
    { nombre: "Refresco", precio: 2.00, imagen: "https://i.ibb.co/p3Yf1zQ/refresco.png", color: "border-red-500" },
  ];

  return (
    <div className="h-screen w-full bg-slate-200 flex flex-col font-sans overflow-hidden">
      <header className="bg-slate-800 text-white p-2 flex justify-between items-center text-sm shadow-md">
        <span className="font-bold tracking-widest">FLORIDA CAFÉ</span>
        <span className="bg-slate-700 px-3 py-1 rounded">Venta en Curso</span>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* LADO IZQUIERDO: El Ticket interactivo */}
        <div className="w-1/3 bg-white border-r-2 border-slate-300 flex flex-col shadow-inner">
          <div className="bg-indigo-600 p-3 text-white font-bold text-sm flex justify-between uppercase">
            <span>Artículo</span>
            <span>Importe</span>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {carrito.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-300 italic">Ticket vacío</div>
            ) : (
              carrito.map((item) => (
                <div key={item.id} className="flex justify-between items-center p-3 border-b hover:bg-slate-50 group">
                  <div className="flex items-center gap-2">
                    {/* BOTÓN X PARA ELIMINAR INDIVIDUALMENTE */}
                    <button onClick={() => eliminarUno(item.id)} className="text-red-500 hover:bg-red-100 rounded-full w-6 h-6 flex items-center justify-center font-bold">✕</button>
                    <span className="text-sm font-medium">{item.nombre}</span>
                  </div>
                  <span className="font-mono font-bold text-indigo-700">{item.precio.toFixed(2)} €</span>
                </div>
              ))
            )}
          </div>

          <div className="bg-slate-800 p-5 text-white">
            <div className="flex justify-between items-end">
              <span className="text-slate-400 text-sm font-bold uppercase">Total</span>
              <span className="text-4xl font-black text-white leading-none tracking-tighter">{total.toFixed(2)} €</span>
            </div>
          </div>
        </div>

        {/* LADO DERECHO: Grid de productos mejorado */}
        <div className="w-2/3 p-4 overflow-y-auto bg-slate-100 grid grid-cols-3 sm:grid-cols-4 gap-3 content-start">
          {productos.map((prod) => (
            <button 
              key={prod.nombre}
              onClick={() => agregar(prod.nombre, prod.precio)} 
              className={`bg-white p-2 rounded-xl shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-95 transition-all border-b-4 ${prod.color}`}
            >
              <div className="h-20 w-full flex items-center justify-center mb-2 overflow-hidden">
                <img src={prod.imagen} className="max-h-full object-contain" alt={prod.nombre} />
              </div>
              <div className="font-black text-[10px] uppercase text-slate-700 truncate">{prod.nombre}</div>
              <div className="text-indigo-600 font-bold text-sm leading-none mt-1">{prod.precio.toFixed(2)}€</div>
            </button>
          ))}
        </div>
      </div>

      {/* FOOTER: Botones de control */}
      <footer className="bg-slate-900 p-3 flex gap-3 shadow-2xl">
        <button onClick={borrarTodo} className="flex-1 bg-slate-700 hover:bg-red-700 text-white font-black py-4 rounded-xl uppercase text-xs transition-colors">Anular Ticket</button>
        <button onClick={() => alert("Cobrando: " + total + "€")} className="flex-[2] bg-emerald-500 hover:bg-emerald-400 text-white font-black py-4 rounded-xl uppercase text-xl shadow-lg shadow-emerald-500/20 active:translate-y-1 transition-all">Cobrar ahora</button>
      </footer>
    </div>
  );
}

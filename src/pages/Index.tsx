import React, { useState } from "react";

export default function Index() {
  const [carrito, setCarrito] = useState<{nombre: string, precio: number, id: number}[]>([]);
  
  const total = carrito.reduce((acc, item) => acc + item.precio, 0);

  const agregar = (nombre: string, precio: number) => {
    setCarrito([...carrito, { nombre, precio, id: Date.now() }]);
  };

  const borrarTodo = () => setCarrito([]);

  return (
    <div className="h-screen w-full bg-slate-200 flex flex-col font-sans overflow-hidden">
      {/* Cabecera */}
      <header className="bg-slate-800 text-white p-2 flex justify-between items-center text-sm">
        <span>Florida Café - TPV</span>
        <span>05/02/2026</span>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* LADO IZQUIERDO: El Ticket (Como en tu foto) */}
        <div className="w-1/3 bg-white border-r-2 border-slate-300 flex flex-col">
          <div className="bg-indigo-100 p-2 font-bold text-xs border-b flex justify-between">
            <span>Artículo</span>
            <span>Importe</span>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {carrito.map((item) => (
              <div key={item.id} className="flex justify-between text-sm border-b pb-1">
                <span>{item.nombre}</span>
                <span className="font-mono">{item.precio.toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="bg-slate-100 p-4 border-t-2">
            <div className="flex justify-between text-2xl font-black text-indigo-800">
              <span>TOTAL</span>
              <span>{total.toFixed(2)} €</span>
            </div>
          </div>
        </div>

        {/* LADO DERECHO: Botones con fotos */}
        <div className="w-2/3 p-4 overflow-y-auto bg-slate-100">
          <div className="grid grid-cols-3 gap-4">
            
            {/* Producto 1: Café */}
            <button onClick={() => agregar("Café Solo", 1.50)} className="bg-white p-2 rounded shadow hover:bg-indigo-50 border-b-4 border-indigo-500">
              <img src="https://i.ibb.co/L6vV0rM/cafe.png" className="h-20 mx-auto object-contain" alt="Café" />
              <div className="font-bold text-xs mt-2 uppercase">Café</div>
              <div className="text-indigo-600 font-bold">1.50€</div>
            </button>

            {/* Producto 2: Té */}
            <button onClick={() => agregar("Té Moruno", 2.00)} className="bg-white p-2 rounded shadow hover:bg-indigo-50 border-b-4 border-green-500">
              <img src="https://i.ibb.co/p3Yf1zQ/te.png" className="h-20 mx-auto object-contain" alt="Té" />
              <div className="font-bold text-xs mt-2 uppercase">Té Moruno</div>
              <div className="text-green-600 font-bold">2.00€</div>
            </button>

            {/* Producto 3: Msemen */}
            <button onClick={() => agregar("Msemen", 2.50)} className="bg-white p-2 rounded shadow hover:bg-indigo-50 border-b-4 border-orange-500">
              <img src="https://i.ibb.co/Xz9W3Ym/msemen.png" className="h-20 mx-auto object-contain" alt="Msemen" />
              <div className="font-bold text-xs mt-2 uppercase">Msemen</div>
              <div className="text-orange-600 font-bold">2.50€</div>
            </button>

          </div>
        </div>
      </div>

      {/* BOTONES DE ACCIÓN (Abajo) */}
      <footer className="bg-slate-800 p-2 flex gap-2">
        <button onClick={borrarTodo} className="flex-1 bg-red-600 text-white font-bold py-4 rounded uppercase text-sm">Borrar Ticket</button>
        <button className="flex-1 bg-blue-600 text-white font-bold py-4 rounded uppercase text-sm">Cuentas</button>
        <button onClick={() => alert("Cobrando: " + total + "€")} className="flex-2 bg-green-600 text-white font-bold py-4 px-10 rounded uppercase text-xl shadow-lg">Cobrar</button>
      </footer>
    </div>
  );
}

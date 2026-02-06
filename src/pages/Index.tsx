import React, { useState } from "react";

export default function Index() {
  const [carrito, setCarrito] = useState<{nombre: string, precio: number, id: number}[]>([]);
  const [dineroEnCaja, setDineroEnCaja] = useState(0);

  const totalTicket = carrito.reduce((acc, item) => acc + item.precio, 0);

  const agregar = (nombre: string, precio: number) => {
    setCarrito([...carrito, { nombre, precio, id: Date.now() }]);
  };

  const eliminarUno = (id: number) => {
    setCarrito(carrito.filter(item => item.id !== id));
  };

  const cobrar = () => {
    if (carrito.length === 0) return;
    setDineroEnCaja(dineroEnCaja + totalTicket);
    setCarrito([]);
    alert("Venta realizada con éxito");
  };

  const realizarCierre = () => {
    alert("CIERRE DE CAJA\n-------------------\nTotal vendido hoy: " + dineroEnCaja.toFixed(2) + " €");
  };

  // Nombres actualizados según tus archivos .jpg subidos
  const productos = [
    { nombre: "Café Solo", precio: 1.50, imagen: "/cafe.jpg", color: "border-amber-700" },
    { nombre: "Café con Leche", precio: 1.80, imagen: "/cafe-con-leche.jpg", color: "border-amber-500" },
    { nombre: "Msemen", precio: 2.00, imagen: "/msemen.jpg", color: "border-orange-500" },
    { nombre: "Khobza", precio: 1.00, imagen: "/khobza.jpg", color: "border-yellow-600" },
    { nombre: "Refresco", precio: 2.00, imagen: "/refresco.jpg", color: "border-red-500" },
  ];

  return (
    <div className="h-screen w-full bg-slate-200 flex flex-col font-sans overflow-hidden text-slate-900">
      <header className="bg-slate-800 text-white p-3 flex justify-between items-center shadow-md">
        <h1 className="font-black italic">FLORIDA CAFÉ</h1>
        <button onClick={realizarCierre} className="bg-red-600 px-4 py-1 rounded-lg font-bold text-xs shadow-lg">CIERRE DE CAJA</button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Ticket Izquierda */}
        <div className="w-1/3 bg-white border-r-2 border-slate-300 flex flex-col">
          <div className="bg-indigo-600 p-2 text-white text-[10px] font-bold flex justify-between uppercase">
            <span>Artículo</span>
            <span>Importe</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {carrito.map((item) => (
              <div key={item.id} className="flex justify-between p-3 border-b items-center hover:bg-slate-50">
                <button onClick={() => eliminarUno(item.id)} className="text-red-500 font-bold mr-2">✕</button>
                <span className="flex-1 text-sm font-medium">{item.nombre}</span>
                <span className="font-bold text-indigo-700">{item.precio.toFixed(2)} €</span>
              </div>
            ))}
          </div>
          <div className="bg-slate-900 p-5 text-white">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Total</span>
              <span className="text-4xl font-black text-emerald-400">{totalTicket.toFixed(2)} €</span>
            </div>
          </div>
        </div>

        {/* Productos Derecha */}
        <div className="w-2/3 p-4 bg-slate-100 overflow-y-auto grid grid-cols-2 md:grid-cols-3 gap-4 content-start">
          {productos.map((p) => (
            <button key={p.nombre} onClick={() => agregar(p.nombre, p.precio)} className={`bg-white p-3 rounded-2xl shadow-sm border-b-8 ${p.color} active:scale-95 transition-all`}>
              <div className="h-24 w-full flex items-center justify-center mb-2">
                <img src={p.imagen} className="max-h-full object-contain" alt={p.nombre} />
              </div>
              <div className="text-[11px] font-black uppercase text-slate-600">{p.nombre}</div>
              <div className="text-indigo-600 font-black text-lg">{p.precio.toFixed(2)}€</div>
            </button>
          ))}
        </div>
      </div>

      <footer className="bg-slate-800 p-4">
        <button onClick={cobrar} className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-black py-4 rounded-2xl text-2xl shadow-xl transition-all active:translate-y-1">COBRAR</button>
      </footer>
    </div>
  );
}

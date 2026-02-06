import React, { useState } from "react";

export default function Index() {
  const [carrito, setCarrito] = useState<{nombre: string, precio: number, id: number}[]>([]);
  const [totalDia, setTotalDia] = useState(0);
  const [ventasRealizadas, setVentasRealizadas] = useState(0);

  const totalActual = carrito.reduce((acc, item) => acc + item.precio, 0);

  const agregar = (nombre: string, precio: number) => {
    setCarrito([...carrito, { nombre, precio, id: Date.now() }]);
  };

  const eliminarUno = (id: number) => {
    setCarrito(carrito.filter(item => item.id !== id));
  };

  const cobrar = () => {
    if (carrito.length === 0) return;
    setTotalDia(prev => prev + totalActual);
    setVentasRealizadas(prev => prev + 1);
    setCarrito([]);
    alert("Venta completada con éxito");
  };

  const cierreDeCaja = () => {
    const mensaje = `CIERRE DE CAJA\n\nTotal Ventas: ${totalDia.toFixed(2)} €\nTickets: ${ventasRealizadas}\n\n¿Deseas reiniciar la caja?`;
    if (window.confirm(mensaje)) {
      setTotalDia(0);
      setVentasRealizadas(0);
    }
  };

  const productos = [
    { nombre: "Café Solo", precio: 1.50, imagen: "https://i.postimg.cc/mD8mK0N1/image-1e7ee8.png", color: "border-amber-700" },
    { nombre: "Barrad de Té", precio: 3.50, imagen: "https://i.postimg.cc/85zK0yN4/image-1e7fdb.png", color: "border-green-700" },
    { nombre: "Té con Menta", precio: 1.50, imagen: "https://i.postimg.cc/YSpR8GmW/image-1e7fbc.png", color: "border-green-400" },
    { nombre: "Msemen", precio: 2.00, imagen: "https://i.postimg.cc/y86Ryk68/image-1e82a5.png", color: "border-orange-500" },
    { nombre: "Khobza", precio: 1.00, imagen: "https://i.postimg.cc/WbV49gYd/image-1e835e.png", color: "border-yellow-600" },
    { nombre: "Batido", precio: 3.00, imagen: "https://i.postimg.cc/vTfRkLCH/image-1e839a.png", color: "border-pink-400" },
    { nombre: "Refresco", precio: 2.00, imagen: "https://i.postimg.cc/tJn4NqX2/image-1e8667.png", color: "border-red-500" },
  ];

  return (
    <div className="h-screen w-full bg-slate-200 flex flex-col font-sans overflow-hidden text-slate-900">
      <header className="bg-slate-800 text-white p-3 flex justify-between items-center shadow-md">
        <h1 className="font-black tracking-tighter text-xl italic">FLORIDA CAFÉ</h1>
        <button 
          onClick={cierreDeCaja}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-1 rounded-lg font-bold text-sm transition-colors shadow-lg"
        >
          CIERRE DE CAJA
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Ticket a la izquierda */}
        <div className="w-1/3 bg-white border-r-2 border-slate-300 flex flex-col">
          <div className="bg-indigo-600 p-3 text-white font-bold text-xs flex justify-between uppercase tracking-widest">
            <span>Artículo</span>
            <span>Importe</span>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {carrito.map((item) => (
              <div key={item.id} className="flex justify-between items-center p-4 border-b hover:bg-slate-50">
                <div className="flex items-center gap-3">
                  <button onClick={() => eliminarUno(item.id)} className="text-red-500 font-bold hover:scale-125 transition-transform">✕</button>
                  <span className="text-sm font-semibold">{item.nombre}</span>
                </div>
                <span className="font-bold text-indigo-700">{item.precio.toFixed(2)} €</span>
              </div>
            ))}
          </div>

          <div className="bg-slate-900 p-6 text-white shadow-[0_-4px_10px_rgba(0,0,0,0.1)]">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-bold uppercase text-xs">Total Ticket</span>
              <span className="text-5xl font-black text-emerald-400 tracking-tighter">{totalActual.toFixed(2)} €</span>
            </div>
          </div>
        </div>

        {/* Productos a la derecha */}
        <div className="w-2/3 p-6 bg-slate-100 overflow-y-auto grid grid-cols-2 lg:grid-cols-4 gap-4 content-start">
          {productos.map((prod) => (
            <button 
              key={prod.nombre}
              onClick={() => agregar(prod.nombre, prod.precio)} 
              className={`bg-white p-3 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 active:scale-95 transition-all border-b-8 ${prod.color}`}
            >
              <div className="h-24 w-full flex items-center justify-center mb-3">
                <img src={prod.imagen} className="max-h-full object-contain pointer-events-none" alt={prod.nombre} />
              </div>
              <div className="font-black text-[11px] uppercase text-slate-600 mb-1">{prod.nombre}</div>
              <div className="text-indigo-600 font-black text-lg">{prod.precio.toFixed(2)}€</div>
            </button>
          ))}
        </div>
      </div>

      <footer className="bg-slate-800 p-4 flex gap-4">
        <button 
          onClick={() => setCarrito([])} 
          className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold py-4 rounded-2xl uppercase text-sm border border-slate-600 transition-colors"
        >
          Anular Carrito
        </button>
        <button 
          onClick={cobrar}
          className="flex-[2] bg-emerald-500 hover:bg-emerald-400 text-white font-black py-4 rounded-2xl uppercase text-2xl shadow-[0_4px_15px_rgba(16,185,129,0.3)] active:translate-y-1 transition-all"
        >
          Cobrar Ahora
        </button>
      </footer>
    </div>
  );
}

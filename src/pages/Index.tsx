import React, { useState } from "react";

export default function Index() {
  const [total, setTotal] = useState(0);

  const agregarProducto = (precio: number) => setTotal(total + precio);

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans text-slate-900">
      <header className="bg-indigo-700 text-white p-6 rounded-2xl shadow-xl mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Florida POS</h1>
          <p className="text-indigo-100 opacity-80 text-sm">Gestión de Ventas</p>
        </div>
        <div className="bg-white/20 px-6 py-3 rounded-xl backdrop-blur-md text-right">
          <span className="text-xs uppercase font-bold block mb-1">Total a Cobrar</span>
          <span className="text-4xl font-black">${total.toFixed(2)}</span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center border-b pb-4">
            <span className="w-2 h-6 bg-indigo-500 rounded-full mr-3"></span>
            Productos Disponibles
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
            <button onClick={() => agregarProducto(15)} className="group p-6 bg-white border-2 border-slate-100 rounded-2xl hover:border-indigo-500 hover:shadow-md transition-all text-center">
               <div className="text-4xl mb-3">🍔</div>
               <div className="font-bold text-slate-700">Menú A</div>
               <div className="text-indigo-600 font-bold mt-1">$15.00</div>
            </button>
            <button onClick={() => agregarProducto(25)} className="group p-6 bg-white border-2 border-slate-100 rounded-2xl hover:border-indigo-500 hover:shadow-md transition-all text-center">
               <div className="text-4xl mb-3">🍕</div>
               <div className="font-bold text-slate-700">Menú B</div>
               <div className="text-indigo-600 font-bold mt-1">$25.00</div>
            </button>
            <button onClick={() => agregarProducto(10)} className="group p-6 bg-white border-2 border-slate-100 rounded-2xl hover:border-indigo-500 hover:shadow-md transition-all text-center">
               <div className="text-4xl mb-3">🥤</div>
               <div className="font-bold text-slate-700">Bebida</div>
               <div className="text-indigo-600 font-bold mt-1">$10.00</div>
            </button>
          </div>
        </div>
        
        <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-2xl h-fit sticky top-6">
          <h2 className="text-xl font-bold mb-6 text-indigo-300">Resumen de Caja</h2>
          <div className="space-y-4">
            <div className="flex justify-between border-b border-slate-800 pb-4">
              <span className="text-slate-400">Estado</span>
              <span className="text-green-400 font-bold">● Abierta</span>
            </div>
            <button onClick={() => setTotal(0)} className="w-full bg-slate-800 hover:bg-red-900/40 text-red-400 py-4 rounded-xl font-bold transition-colors border border-red-900/20">
              Limpiar Carrito
            </button>
            <button onClick={() => alert('Venta realizada por $' + total)} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-xl font-bold shadow-lg shadow-indigo-500/30 transition-all">
              Finalizar Venta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

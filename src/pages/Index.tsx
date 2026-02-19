import React, { useState, useEffect } from "react";
import { PRODUCTS } from "../data/products";
import { Sale } from "../types/pos";

// Extended types for File System Access API
interface FileSystemWritableFileStream extends WritableStream {
  write(data: any): Promise<void>;
  seek(position: number): Promise<void>;
  truncate(size: number): Promise<void>;
}

interface FileSystemFileHandle extends FileSystemHandle {
  readonly kind: 'file';
  getFile(): Promise<File>;
  createWritable(options?: { keepExistingData?: boolean }): Promise<FileSystemWritableFileStream>;
}

interface FileSystemDirectoryHandle extends FileSystemHandle {
  readonly kind: 'directory';
  getDirectoryHandle(name: string, options?: { create?: boolean }): Promise<FileSystemDirectoryHandle>;
  getFileHandle(name: string, options?: { create?: boolean }): Promise<FileSystemFileHandle>;
}

export default function Index() {
  const [carrito, setCarrito] = useState<{ name: string, price: number, id: number, time: string }[]>([]);
  const [salesHistory, setSalesHistory] = useState<Sale[]>(() => {
    const saved = localStorage.getItem("florida_sales_history");
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [manualAmount, setManualAmount] = useState("");
  const [reportType, setReportType] = useState<"daily" | "monthly" | null>(null);
  const [reportFolder, setReportFolder] = useState<FileSystemDirectoryHandle | null>(null);

  useEffect(() => {
    localStorage.setItem("florida_sales_history", JSON.stringify(salesHistory));
  }, [salesHistory]);

  const totalTicket = carrito.reduce((acc: number, item: { price: number }) => acc + item.price, 0);

  const agregar = (name: string, price: number) => {
    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setCarrito([...carrito, { name, price, id: Date.now(), time }]);
  };

  const agregarManual = () => {
    const precio = parseFloat(manualAmount);
    if (!isNaN(precio) && precio > 0) {
      agregar("Importe Manual", precio);
      setManualAmount("");
    }
  };

  const pressNum = (num: string) => {
    if (num === "." && manualAmount.includes(".")) return;
    setManualAmount(manualAmount + num);
  };

  const eliminarUno = (id: number) => {
    setCarrito(carrito.filter((item: { id: number }) => item.id !== id));
  };

  const cobrar = () => {
    if (carrito.length === 0) return;

    const now = new Date();
    const newSale: Sale = {
      id: Date.now(),
      timestamp: now.toISOString(),
      items: carrito.map((i: { name: string, price: number }) => ({ name: i.name, price: i.price })),
      total: totalTicket
    };

    setSalesHistory([...salesHistory, newSale]);
    setCarrito([]);
    alert("Venta realizada con éxito ✅");
  };

  const printReport = (type: "daily" | "monthly") => {
    setReportType(type);
    setTimeout(() => {
      window.print();
      setReportType(null);
    }, 100);
  };

  const salesAtSelectedDate = salesHistory.filter((s: Sale) => s.timestamp.startsWith(selectedDate));
  const totalAtSelectedDate = salesAtSelectedDate.reduce((acc: number, s: Sale) => acc + s.total, 0);

  const getMonthlySales = () => {
    const month = selectedDate.substring(0, 7);
    return salesHistory.filter((s: Sale) => s.timestamp.startsWith(month));
  };

  const totalMonthly = getMonthlySales().reduce((acc: number, s: Sale) => acc + s.total, 0);

  const descargarTXTParaFichero = (filename: string, text: string) => {
    const element = document.createElement("a");
    const file = new Blob([text], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const seleccionarCarpeta = async () => {
    try {
      const handle = await (window as any).showDirectoryPicker();
      setReportFolder(handle);
      alert("Carpeta de reportes configurada correctamente 📂");
    } catch (err) {
      console.error("Error al seleccionar carpeta:", err);
      alert("No se pudo seleccionar la carpeta.");
    }
  };

  const realizarCierre = async () => {
    // Usar la fecha seleccionada en el calendario (selectedDate está en formato YYYY-MM-DD)
    const dateParts = selectedDate.split('-');
    const añoStr = dateParts[0];
    const mesStr = dateParts[1];
    const diaStr = dateParts[2]; // Mantiene el cero inicial si existe

    // Obtener nombre del mes desde la fecha seleccionada
    // Añadimos T12:00:00 para evitar desajustes de zona horaria
    const tempDate = new Date(selectedDate + "T12:00:00");
    const mesNombreRaw = tempDate.toLocaleDateString('es-ES', { month: 'long' });
    const mesNombre = mesNombreRaw.charAt(0).toUpperCase() + mesNombreRaw.slice(1);

    const todaysSales = salesHistory.filter((s: Sale) => s.timestamp.startsWith(selectedDate));
    const totalToday = todaysSales.reduce((acc: number, s: Sale) => acc + s.total, 0);

    let reportContent = `FLORIDA CAFÉ - CIERRE DE CAJA\n`;
    reportContent += `Fecha Seleccionada: ${selectedDate}\n`;
    reportContent += `Mes: ${mesNombre}\n`;
    reportContent += `Día: ${diaStr}\n`;
    reportContent += `------------------------------------------\n`;

    todaysSales.forEach((sale: Sale, index: number) => {
      const time = new Date(sale.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      reportContent += `Venta #${index + 1} - ${time}\n`;
      sale.items.forEach((item: { name: string, price: number }) => {
        reportContent += `  - ${item.name}: ${item.price.toFixed(2)} MAD\n`;
      });
      reportContent += `  TOTAL: ${sale.total.toFixed(2)} MAD\n`;
      reportContent += `------------------------------------------\n`;
    });

    reportContent += `\nTOTAL DEL DÍA: ${totalToday.toFixed(2)} MAD\n`;

    if (reportFolder) {
      try {
        const yearFolder = await reportFolder.getDirectoryHandle(añoStr, { create: true });
        const monthFolder = await yearFolder.getDirectoryHandle(mesNombre, { create: true });
        const fileHandle = await monthFolder.getFileHandle(`dia_${diaStr}.txt`, { create: true });
        const writable = await (fileHandle as any).createWritable();
        await writable.write(reportContent);
        await writable.close();
        alert(`Cierre guardado en: ${añoStr}/${mesNombre}/dia_${diaStr}.txt ✅`);
      } catch (err: any) {
        console.error("Error al guardar en carpeta:", err);
        descargarTXTParaFichero(`cierre_${selectedDate}.txt`, reportContent);
        alert("Error al guardar en carpeta. Se ha descargado el archivo normalmente.");
      }
    } else {
      descargarTXTParaFichero(`cierre_${selectedDate}.txt`, reportContent);
      alert(`Cierre realizado y descargado. Total: ${totalToday.toFixed(2)} MAD\n(Configura una carpeta para guardado automático)`);
    }
  };

  const descargarReporteMensual = () => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const monthStr = `${year}-${month.toString().padStart(2, '0')}`;

    const monthlySales = salesHistory.filter((s: Sale) => s.timestamp.startsWith(monthStr));
    const totalMonth = monthlySales.reduce((acc: number, s: Sale) => acc + s.total, 0);

    let reportContent = `FLORIDA CAFÉ - REPORTE MENSUAL\n`;
    reportContent += `Mes: ${monthStr}\n`;
    reportContent += `------------------------------------------\n`;

    // Agrupar por día
    const salesByDay: { [key: string]: number } = {};
    monthlySales.forEach((s: Sale) => {
      const day = s.timestamp.split('T')[0];
      salesByDay[day] = (salesByDay[day] || 0) + s.total;
    });

    Object.keys(salesByDay).sort().forEach(day => {
      reportContent += `${day}: ${salesByDay[day].toFixed(2)} MAD\n`;
    });

    reportContent += `------------------------------------------\n`;
    reportContent += `TOTAL MENSUAL: ${totalMonth.toFixed(2)} MAD\n`;

    descargarTXTParaFichero(`reporte_mensual_${monthStr}.txt`, reportContent);
  };

  return (
    <div className="h-screen w-full bg-slate-200 flex flex-col font-sans overflow-hidden text-slate-900">
      {/* PROFESSIONAL PRINT OVERLAY (Hidden on screen) */}
      {reportType && (
        <div className="fixed inset-0 bg-white z-[9999] p-8 print:block hidden text-slate-900 border-8 border-slate-100 h-full overflow-y-auto">
          <div className="flex justify-between items-start border-b-4 border-slate-800 pb-4 mb-6">
            <div>
              <h1 className="text-4xl font-black italic mb-1 uppercase tracking-tighter">FLORIDA CAFÉ 🌴</h1>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Informe oficial de ventas</p>
            </div>
            <div className="text-right">
              <p className="font-black text-xl uppercase">{reportType === 'daily' ? 'Cierre de Caja' : 'Resumen Mensual'}</p>
              <p className="text-slate-500 font-bold">{reportType === 'daily' ? selectedDate : selectedDate.substring(0, 7)}</p>
            </div>
          </div>

          {reportType === 'daily' ? (
            <div>
              <div className="mb-6 p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 border-b pb-2">Resumen de Productos</h3>
                <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                  {(Object.entries(salesAtSelectedDate.reduce((acc: { [key: string]: number }, s: Sale) => {
                    s.items.forEach((item: { name: string }) => {
                      acc[item.name] = (acc[item.name] || 0) + 1;
                    });
                    return acc;
                  }, {} as { [key: string]: number })) as [string, number][]).sort().map(([name, qty]) => (
                    <div key={name} className="flex justify-between text-sm border-b border-slate-100 pb-1">
                      <span className="font-bold text-slate-700">{name}</span>
                      <span className="font-black text-indigo-600">x{qty}</span>
                    </div>
                  ))}
                </div>
              </div>

              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 mt-8">Detalle Cronológico</h3>
              <table className="w-full text-left">
                <thead className="border-b-2 border-slate-300 uppercase text-[10px] font-black text-slate-400">
                  <tr>
                    <th className="py-2">Hora</th>
                    <th>Concepto</th>
                    <th className="text-right">Importe</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {salesAtSelectedDate.map((s: Sale, idx: number) => (
                    <React.Fragment key={s.id}>
                      <tr className="bg-slate-50 font-bold border-t border-slate-100">
                        <td className="py-2">{new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                        <td>VENTA #{idx + 1}</td>
                        <td className="text-right font-black text-indigo-700">{s.total.toFixed(2)} MAD</td>
                      </tr>
                      {s.items.map((item: { name: string, price: number }, iidx: number) => (
                        <tr key={iidx} className="text-slate-500 text-[10px]">
                          <td />
                          <td className="pl-4 pb-1">- {item.name}</td>
                          <td className="text-right">{item.price.toFixed(2)} MAD</td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
              <div className="mt-8 pt-4 border-t-4 border-slate-800 flex justify-between items-center">
                <span className="text-2xl font-black uppercase tracking-tighter">Total del día:</span>
                <span className="text-4xl font-black">{totalAtSelectedDate.toFixed(2)} MAD</span>
              </div>
            </div>
          ) : (
            <div>
              <table className="w-full text-left border-collapse">
                <thead className="border-b-2 border-slate-300 uppercase text-[10px] font-black text-slate-400">
                  <tr>
                    <th className="py-2 border-r pr-4">Fecha</th>
                    <th className="text-right">Total Día</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {(Object.entries(getMonthlySales().reduce((acc: { [key: string]: number }, s: Sale) => {
                    const day = s.timestamp.split('T')[0];
                    acc[day] = (acc[day] || 0) + s.total;
                    return acc;
                  }, {} as { [key: string]: number })) as [string, number][]).sort().map(([day, total]) => (
                    <tr key={day} className="border-b border-slate-100">
                      <td className="py-2 font-bold border-r pr-4">{day}</td>
                      <td className="text-right font-black">{total.toFixed(2)} MAD</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-8 pt-4 border-t-4 border-slate-800 flex justify-between items-center">
                <span className="text-2xl font-black uppercase tracking-tighter">Total Mes:</span>
                <span className="text-4xl font-black">{totalMonthly.toFixed(2)} MAD</span>
              </div>
            </div>
          )}

          <div className="mt-12 text-[10px] text-slate-400 border-t pt-4 flex justify-between italic">
            <span>Florida Café POS - Software de gestión</span>
            <span>Generado el: {new Date().toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* HEADER (Screen Only) */}
      <header className="bg-slate-800 text-white p-3 flex justify-between items-center shadow-md print:hidden">
        <div className="flex items-center gap-4">
          <h1 className="font-black italic text-xl uppercase tracking-tighter">FLORIDA CAFÉ 🌴</h1>
          <div className="bg-slate-700 p-1 px-3 rounded-xl border border-slate-600 flex items-center gap-2 group">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-indigo-400 transition-colors">Historial:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-sm font-black focus:outline-none cursor-pointer uppercase tracking-tighter"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={seleccionarCarpeta} className={`${reportFolder ? 'bg-emerald-600' : 'bg-orange-600'} hover:opacity-90 px-4 py-2 rounded-xl font-black text-xs shadow-lg transition-all active:scale-95 uppercase tracking-tighter flex items-center gap-2`}>
            {reportFolder ? '📁 CARPETA OK' : '📁 CONFIG. CARPETA'}
          </button>
          <button onClick={realizarCierre} className="bg-red-600 hover:bg-red-500 px-4 py-2 rounded-xl font-black text-xs shadow-lg transition-all active:scale-95 uppercase tracking-tighter border-b-4 border-red-800">CIERRE DÍA (GUARDAR)</button>
          <button onClick={() => printReport('daily')} className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-xl font-black text-xs shadow-lg transition-all active:scale-95 uppercase tracking-tighter border-b-4 border-slate-900">IMPRIMIR TICKET DÍA</button>
          <button onClick={() => printReport('monthly')} className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-xl font-black text-xs shadow-lg transition-all active:scale-95 uppercase tracking-tighter border-b-4 border-indigo-800">INFORME MES (PDF)</button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Ticket Izquierda con Teclado Numérico */}
        <div className="w-1/3 bg-white border-r-2 border-slate-300 flex flex-col">
          <div className="bg-slate-800 p-2 text-white text-[10px] font-bold flex justify-between uppercase tracking-widest">
            <span>Ticket Actual</span>
            <span className="text-emerald-400 italic font-black">Venta Abierta</span>
          </div>
          <div className="flex-1 overflow-y-auto bg-slate-50 shadow-inner">
            {carrito.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-300 p-10 text-center gap-4 group">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-4xl group-hover:scale-110 transition-transform duration-500">☕</div>
                <p className="font-bold text-xs uppercase tracking-widest leading-relaxed">Carrito vacío<br />Selecciona un producto</p>
              </div>
            ) : (
              carrito.map((item) => (
                <div key={item.id} className="flex justify-between p-3 border-b border-slate-200 items-center animate-in fade-in slide-in-from-left-2 duration-200 hover:bg-white transition-colors">
                  <button onClick={() => eliminarUno(item.id)} className="w-10 h-10 flex items-center justify-center bg-red-50 text-red-500 rounded-xl font-bold transition-all hover:bg-red-500 hover:text-white active:scale-90 shadow-sm">✕</button>
                  <div className="flex-1 px-4">
                    <div className="text-base font-black text-slate-800 uppercase tracking-tight leading-4">{item.name}</div>
                    <div className="flex items-center gap-1 text-[11px] text-indigo-500 font-black bg-indigo-50 w-fit px-2 py-0.5 rounded-full mt-1.5 shadow-sm">
                      <span className="opacity-70 text-[10px]">🕒</span> {item.time}
                    </div>
                  </div>
                  <span className="font-black text-indigo-700 text-xl tracking-tighter">{item.price.toFixed(2)} <span className="text-[10px]">MAD</span></span>
                </div>
              ))
            )}
          </div>

          <div className="bg-slate-200 p-3 border-t-2 border-slate-300 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
            <div className="bg-white p-2 mb-3 text-right text-3xl font-mono border-4 border-indigo-100 rounded-2xl shadow-inner h-16 flex items-center justify-end group">
              <span className="text-slate-300 group-hover:text-slate-400 transition-colors mr-auto text-[10px] font-black uppercase tracking-tighter ml-2">Manual:</span>
              <span className="font-black text-indigo-700">{manualAmount || "0.00"}</span>
              <span className="ml-2 text-xs text-slate-400 font-bold uppercase">MAD</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0, "."].map(n => (
                <button key={n} onClick={() => pressNum(n.toString())} className="bg-white py-4 rounded-xl shadow-md text-xl font-black active:scale-95 transition-all hover:bg-slate-50 border-b-4 border-slate-100">{n}</button>
              ))}
              <button onClick={() => setManualAmount("")} className="bg-white py-4 rounded-xl shadow-md text-xl font-black text-orange-600 active:scale-95 hover:bg-orange-50 transition-all border-b-4 border-orange-100 font-mono">C</button>
              <button onClick={agregarManual} className="col-span-4 bg-indigo-600 text-white py-4 rounded-2xl font-black mt-2 shadow-xl hover:bg-indigo-500 active:scale-95 transition-all text-xs uppercase tracking-widest border-b-[6px] border-indigo-800">AÑADIR IMPORTE LIBRE</button>
            </div>
          </div>

          <div className="bg-slate-900 p-4 text-white">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Total</span>
              <span className="text-5xl font-black text-emerald-400">{totalTicket.toFixed(2)} <span className="text-xl">MAD</span></span>
            </div>
          </div>
        </div>

        <div className="w-2/3 p-6 bg-slate-100 overflow-y-auto grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 content-start pb-24">
          {PRODUCTS.map((p) => (
            <button key={p.name} onClick={() => agregar(p.name, p.price)} className={`bg-white rounded-3xl shadow-sm hover:shadow-xl border-2 border-transparent hover:border-indigo-500 active:scale-95 transition-all group relative overflow-hidden flex flex-col h-full bg-gradient-to-b from-white to-slate-50`}>
              <div className="aspect-square w-full overflow-hidden bg-slate-200">
                <img src={p.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 aspect-square" alt={p.name} />
              </div>
              <div className="p-4 flex flex-col flex-1 text-left">
                <div className="text-[10px] font-black uppercase text-indigo-500 tracking-widest mb-1 opacity-80">{p.name.split(' ')[0]}</div>
                <div className="text-sm font-black text-slate-800 uppercase leading-tight mb-2 flex-grow">{p.name}</div>
                <div className="flex justify-between items-end">
                  <div className="text-slate-400 text-[10px] font-bold">Importe:</div>
                  <div className="text-indigo-600 font-black text-xl tracking-tighter">{p.price.toFixed(2)} <span className="text-[10px] ml-0.5">MAD</span></div>
                </div>
              </div>
              <div className={`h-1.5 w-full ${p.color.replace('border-', 'bg-')}`}></div>
            </button>
          ))}
        </div>
      </div>

      <footer className="bg-slate-900 px-8 py-4 shadow-[0_-15px_40px_rgba(0,0,0,0.4)] print:hidden relative z-10 flex justify-center">
        <button onClick={cobrar} className="w-full max-w-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-black py-4 rounded-2xl text-2xl shadow-lg transition-all active:scale-95 uppercase tracking-widest border-b-[4px] border-emerald-700 flex items-center justify-center gap-3">
          <span className="text-sm opacity-50 font-normal">Finalizar ticket y</span>
          REALIZAR VENTA
        </button>
      </footer>
    </div>
  );
}

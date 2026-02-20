import React, { useState, useEffect, useRef } from "react";
import { PRODUCTS } from "../data/products";
import { Sale, Expense } from "../types/pos";
import { supabase } from "../lib/supabaseClient";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

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
  const [businessInfo, setBusinessInfo] = useState({
    name: "FLORIDA CAFÉ",
    nif: "B12345678",
    address: "Florida Café - Tánger",
    city: "Marruecos",
    manager: "Bilal"
  });
  const [archiveReportData, setArchiveReportData] = useState<any>(null);
  const [showArchive, setShowArchive] = useState(false);
  const [loadingArchive, setLoadingArchive] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showExpenses, setShowExpenses] = useState(false);
  const [loadingExpenses, setLoadingExpenses] = useState(false);
  const [newExpense, setNewExpense] = useState({ amount: "", description: "" });
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchSales();
    fetchExpenses();
  }, [selectedDate]);

  const fetchSales = async () => {
    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .order('timestamp', { ascending: true });

    if (error) {
      console.error('Error fetching sales:', error);
    } else if (data) {
      setSalesHistory(data);
    }
  };

  const fetchExpenses = async () => {
    setLoadingExpenses(true);
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching expenses:', error);
    } else if (data) {
      setExpenses(data);
    }
    setLoadingExpenses(false);
  };

  const guardarGasto = async () => {
    if (!newExpense.amount || !newExpense.description) return;

    const { error } = await supabase
      .from('expenses')
      .insert([
        {
          date: selectedDate,
          amount: parseFloat(newExpense.amount),
          description: newExpense.description,
          category: 'Compras Tienda'
        }
      ]);

    if (error) {
      console.error('Error guardando gasto:', error);
      alert("Error al guardar el gasto");
    } else {
      setNewExpense({ amount: "", description: "" });
      fetchExpenses();
      alert("Compra registrada correctamente ✅");
    }
  };

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

  const cobrar = async () => {
    if (carrito.length === 0) return;

    const now = new Date();
    const items = carrito.map((i: { name: string, price: number }) => ({ name: i.name, price: i.price }));

    // Guardar en Supabase primero
    const { data, error } = await supabase
      .from('sales')
      .insert([
        {
          timestamp: now.toISOString(),
          items: items,
          total: totalTicket
        }
      ])
      .select();

    if (error) {
      console.error('Error guardando venta:', error);
      alert("Error al guardar en la nube, pero se guardará localmente.");
    }

    const newSale: Sale = {
      id: data ? data[0].id : Date.now(),
      timestamp: now.toISOString(),
      items: items,
      total: totalTicket
    };

    setSalesHistory([...salesHistory, newSale]);
    setCarrito([]);
    alert("Venta realizada y guardada en la nube ✅");
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
    const todaysSales = salesHistory.filter((s: Sale) => s.timestamp.startsWith(selectedDate));
    const totalToday = todaysSales.reduce((acc: number, s: Sale) => acc + s.total, 0);

    const dateParts = selectedDate.split('-');
    const diaStr = dateParts[2];
    const tempDate = new Date(selectedDate + "T12:00:00");
    const mesNombreRaw = tempDate.toLocaleDateString('es-ES', { month: 'long' });
    const mesNombre = mesNombreRaw.charAt(0).toUpperCase() + mesNombreRaw.slice(1);

    let reportContent = `FLORIDA CAFÉ - CIERRE DE CAJA\n`;
    reportContent += `Fecha: ${selectedDate}\nTotal: ${totalToday.toFixed(2)} MAD\n`;
    reportContent += `------------------------------------------\n`;

    todaysSales.forEach((sale: Sale, index: number) => {
      reportContent += `Venta #${index + 1}: ${sale.total.toFixed(2)} MAD\n`;
    });

    // 1. Guardar en Supabase (Tabla de resúmenes)
    const { error: dbError } = await supabase
      .from('daily_summaries')
      .upsert({
        date: selectedDate,
        total_amount: totalToday,
        sales_count: todaysSales.length,
        report_text: reportContent
      }, { onConflict: 'date' });

    if (dbError) {
      console.error('Error al guardar resumen en Supabase:', dbError);
    } else {
      alert(`Cierre del ${selectedDate} guardado en la nube ☁️✅`);
    }

    // 2. Guardar en carpeta local (Opcional, si está configurada)
    if (reportFolder) {
      try {
        const añoStr = dateParts[0];
        const yearFolder = await (reportFolder as any).getDirectoryHandle(añoStr, { create: true });
        const monthFolder = await yearFolder.getDirectoryHandle(mesNombre, { create: true });
        const fileHandle = await monthFolder.getFileHandle(`dia_${diaStr}.txt`, { create: true });
        const writable = await (fileHandle as any).createWritable();
        await writable.write(reportContent);
        await writable.close();
        alert(`También guardado en copia local: ${añoStr}/${mesNombre}/dia_${diaStr}.txt ✅`);
      } catch (err: any) {
        console.error("Error al guardar copia local:", err);
      }
    }
  };

  const verCierreGuardado = async () => {
    setLoadingArchive(true);
    setShowArchive(true);
    const { data, error } = await supabase
      .from('daily_summaries')
      .select('*')
      .eq('date', selectedDate)
      .single();

    if (error) {
      console.warn("No se encontró reporte:", error);
      setArchiveReportData({ error: true, text: "No hay ningún reporte guardado para esta fecha." });
    } else if (data) {
      setArchiveReportData(data);
    }
    setLoadingArchive(false);
  };

  const descargarPDF = async () => {
    if (!reportRef.current) return;

    // Configuración para que quede "guapo"
    const canvas = await html2canvas(reportRef.current, {
      scale: 3, // Alta calidad
      useCORS: true,
      backgroundColor: "#ffffff"
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`cierre_florida_${selectedDate}.pdf`);
  };

  const descargarMensual = async () => {
    const month = selectedDate.substring(5, 7);
    const year = selectedDate.substring(0, 4);

    // Filtrar ventas del mes
    const monthSales = salesHistory.filter(s => s.timestamp.startsWith(`${year}-${month}`));
    const monthExpenses = expenses.filter(e => e.date.startsWith(`${year}-${month}`));

    const totalVentas = monthSales.reduce((sum, s) => sum + s.total, 0);
    const totalGastos = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
    const balance = totalVentas - totalGastos;

    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text(`REPORTE MENSUAL: ${month}/${year}`, 20, 30);
    doc.setFontSize(14);
    doc.text(`Florida Café 🌴`, 20, 40);

    doc.line(20, 45, 190, 45);

    doc.text(`TOTAL VENTAS:`, 20, 60);
    doc.text(`${totalVentas.toFixed(2)} MAD`, 140, 60, { align: 'right' });

    doc.text(`TOTAL COMPRAS:`, 20, 70);
    doc.text(`${totalGastos.toFixed(2)} MAD`, 140, 70, { align: 'right' });

    doc.line(20, 75, 190, 75);
    doc.setFontSize(18);
    doc.text(`BALANCE FINAL:`, 20, 90);
    doc.text(`${balance.toFixed(2)} MAD`, 140, 90, { align: 'right' });

    doc.setFontSize(10);
    doc.text(`Generado por Florida POS Cloud System`, 20, 280);

    doc.save(`reporte_mensual_${year}_${month}.pdf`);
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
      {/* ARCHIVE VIEWER OVERLAY - PREMIUM VERSION */}
      {showArchive && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[10000] flex items-center justify-center p-4">
          <div className="bg-slate-100 w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[95vh] border-4 border-white/20">
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-6 text-white flex justify-between items-center border-b border-slate-700">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-indigo-500/30">📚</div>
                <div>
                  <h3 className="font-black uppercase tracking-tighter text-xl">Archivo de Cierres</h3>
                  <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-[0.2em]">Florida Café Cloud System</p>
                </div>
              </div>
              <button
                onClick={() => { setShowArchive(false); setArchiveReportData(null); }}
                className="w-10 h-10 bg-slate-700 hover:bg-red-500/20 hover:text-red-400 rounded-xl transition-all font-black flex items-center justify-center text-lg active:scale-90"
              >✕</button>
            </div>

            <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
              {loadingArchive ? (
                <div className="flex flex-col items-center justify-center py-20 gap-6">
                  <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin shadow-xl"></div>
                  <div className="text-center">
                    <p className="font-black text-slate-800 uppercase text-sm tracking-widest mb-1">Consultando Nube</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter italic">Buscando documentos del {selectedDate}...</p>
                  </div>
                </div>
              ) : archiveReportData?.error ? (
                <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
                  <div className="text-6xl opacity-30">🔍</div>
                  <p className="font-black text-slate-400 uppercase tracking-widest text-sm">{archiveReportData.text}</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* SIMPLIFIED INVOICE DOCUMENT */}
                  <div ref={reportRef} className="bg-white p-12 rounded-lg shadow-inner border border-slate-300 mx-auto w-[210mm] min-h-[140mm] text-slate-800 font-sans">
                    {/* Simple Header */}
                    <div className="flex justify-between items-center border-b-2 border-slate-900 pb-6 mb-8">
                      <div>
                        <h1 className="text-3xl font-black tracking-tight mb-1 uppercase">Florida Café 🌴</h1>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-tight">Ticket de Cierre Diario</p>
                        <p className="text-[10px] font-bold text-slate-500">{businessInfo.address}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black uppercase text-slate-400">Fecha del Cierre</p>
                        <p className="text-xl font-black">{selectedDate}</p>
                        <p className="text-[10px] text-slate-400 italic">Generado: {new Date().toLocaleTimeString()}</p>
                      </div>
                    </div>

                    <div className="mb-10">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b-2 border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-400">
                            <th className="py-2">Producto / Servicio</th>
                            <th className="py-2 text-center">Cant.</th>
                            <th className="py-2 text-right">Precio Unid.</th>
                            <th className="py-2 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody className="text-sm font-bold divide-y divide-slate-100">
                          {/* Grouped products calculation */}
                          {(() => {
                            const grouped: any = {};
                            const currentSales = salesAtSelectedDate;
                            currentSales.forEach((s: Sale) => {
                              s.items.forEach((item: { name: string, price: number }) => {
                                if (!grouped[item.name]) {
                                  grouped[item.name] = { qty: 0, price: item.price, total: 0 };
                                }
                                grouped[item.name].qty += 1;
                                grouped[item.name].total += item.price;
                              });
                            });

                            return Object.entries(grouped).sort().map(([name, data]: [string, any]) => (
                              <tr key={name} className="hover:bg-slate-50 transition-colors">
                                <td className="py-3 uppercase text-slate-700">{name}</td>
                                <td className="py-3 text-center text-indigo-600">x{data.qty}</td>
                                <td className="py-3 text-right text-slate-400">{data.price.toFixed(2)}</td>
                                <td className="py-3 text-right font-black">{data.total.toFixed(2)} <span className="text-[10px]">MAD</span></td>
                              </tr>
                            ));
                          })()}
                        </tbody>
                      </table>
                    </div>

                    {/* Simple Totals */}
                    <div className="mt-8 pt-6 border-t-2 border-slate-900 flex justify-between items-end">
                      <div className="text-[10px] font-black uppercase text-slate-400">
                        <p>Total Operaciones: {archiveReportData?.sales_count || salesAtSelectedDate.length}</p>
                        <p>Responsable: {businessInfo.manager}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[12px] font-black uppercase text-slate-400 mb-1">Total Recaudado</p>
                        <p className="text-5xl font-black tracking-tighter text-slate-900">
                          {archiveReportData?.total_amount?.toFixed(2) || totalAtSelectedDate.toFixed(2)} <span className="text-xl">MAD</span>
                        </p>
                      </div>
                    </div>

                    <div className="mt-12 text-center border-t border-dashed border-slate-200 pt-6">
                      <p className="text-[10px] text-slate-300 font-black uppercase tracking-[0.3em]">Gracias por su visita al Florida Café</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 bg-white border-t border-slate-200 flex gap-4">
              <button
                onClick={() => setShowArchive(false)}
                className="flex-1 bg-slate-100 text-slate-500 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-200 transition-all active:scale-95"
              >Cerrar Visor</button>
              {archiveReportData && !archiveReportData.error && (
                <>
                  <button
                    onClick={() => window.print()}
                    className="flex-1 bg-slate-800 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-700 transition-all active:scale-95 shadow-lg border-b-4 border-slate-950"
                  >Imprimir Copia</button>
                  <button
                    onClick={descargarPDF}
                    className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-indigo-500 transition-all active:scale-95 shadow-xl border-b-4 border-indigo-800 flex items-center justify-center gap-2"
                  >
                    <span>📥</span> DESCARGAR PDF
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* EXPENSES MANAGEMENT MODAL */}
      {showExpenses && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[10000] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-slate-800 p-6 text-white flex justify-between items-center">
              <div>
                <h3 className="font-black uppercase tracking-tighter text-xl text-orange-400">Compras de Tienda 🛒</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Gastos y Suministros</p>
              </div>
              <button onClick={() => setShowExpenses(false)} className="w-10 h-10 bg-slate-700 hover:bg-slate-600 rounded-xl transition-all font-black flex items-center justify-center">✕</button>
            </div>

            <div className="p-8 overflow-y-auto flex-1 bg-slate-50 custom-scrollbar">
              {/* Form to add expense */}
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 mb-8">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Registrar Nueva Compra/Gasto ({selectedDate})</p>
                <div className="grid grid-cols-1 gap-4">
                  <input
                    type="number"
                    placeholder="Importe (Ej: 150.00)"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                    className="w-full bg-slate-50 p-4 rounded-xl border border-slate-200 font-black text-lg focus:ring-2 ring-orange-400 outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Descripción (Ej: Leche, Café, Azúcar...)"
                    value={newExpense.description}
                    onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                    className="w-full bg-slate-50 p-4 rounded-xl border border-slate-200 font-bold focus:ring-2 ring-orange-400 outline-none"
                  />
                  <button
                    onClick={guardarGasto}
                    className="bg-orange-600 text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-orange-500 shadow-lg active:scale-95 transition-all"
                  >Añadir Gasto a la Nube ☁️</button>
                </div>
              </div>

              {/* List of expenses for the period */}
              <div className="space-y-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Historial Reciente de Compras</p>
                {loadingExpenses ? (
                  <div className="animate-pulse flex items-center justify-center p-10">Cargando gastos...</div>
                ) : expenses.length === 0 ? (
                  <div className="text-center py-10 text-slate-300 italic font-bold">No hay gastos registrados</div>
                ) : (
                  expenses.map(exp => (
                    <div key={exp.id} className="bg-white p-4 rounded-2xl border border-slate-200 flex justify-between items-center shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center font-black">€</div>
                        <div>
                          <p className="font-black text-slate-800 uppercase text-xs">{exp.description}</p>
                          <p className="text-[9px] text-slate-400 font-bold">{exp.date}</p>
                        </div>
                      </div>
                      <p className="font-black text-orange-600 text-lg">-{exp.amount.toFixed(2)} <span className="text-xs">MAD</span></p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="p-4 bg-white border-t border-slate-200">
              <button onClick={() => setShowExpenses(false)} className="w-full bg-slate-100 text-slate-500 py-3 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-200 transition-all">Cerrar Ventana</button>
            </div>
          </div>
        </div>
      )}

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
          <button
            onClick={verCierreGuardado}
            className="bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 px-3 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2"
          >
            📚 VER CIERRE GUARDADO
          </button>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowExpenses(true)} className="bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded-xl font-black text-[10px] shadow-lg transition-all active:scale-95 uppercase tracking-tighter border-b-4 border-slate-900 flex items-center gap-2 text-orange-400">
            🛒 COMPRAS TIENDA
          </button>
          <button onClick={() => {
            const name = prompt("Nombre de la Empresa:", businessInfo.name);
            const nif = prompt("NIF/CIF:", businessInfo.nif);
            const address = prompt("Dirección:", businessInfo.address);
            const city = prompt("Ciudad:", businessInfo.city);
            const manager = prompt("Responsable:", businessInfo.manager);
            if (name) setBusinessInfo({ name, nif: nif || "", address: address || "", city: city || "", manager: manager || "" });
          }} className="bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded-xl font-black text-[10px] shadow-lg transition-all active:scale-95 uppercase tracking-tighter border-b-4 border-slate-900 flex items-center gap-2 text-indigo-400">
            ⚙️ DATOS NEGOCIO
          </button>
          <button onClick={seleccionarCarpeta} className={`${reportFolder ? 'bg-emerald-600' : 'bg-orange-600'} hover:opacity-90 px-4 py-2 rounded-xl font-black text-xs shadow-lg transition-all active:scale-95 uppercase tracking-tighter flex items-center gap-2`}>
            {reportFolder ? '📁 CARPETA OK' : '📁 CONFIG. CARPETA'}
          </button>
          <button onClick={realizarCierre} className="bg-red-600 hover:bg-red-500 px-4 py-2 rounded-xl font-black text-xs shadow-lg transition-all active:scale-95 uppercase tracking-tighter border-b-4 border-red-800">CIERRE DÍA (GUARDAR)</button>
          <button onClick={() => printReport('daily')} className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-xl font-black text-xs shadow-lg transition-all active:scale-95 uppercase tracking-tighter border-b-4 border-slate-900">IMPRIMIR TICKET DÍA</button>
          <button onClick={descargarMensual} className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-xl font-black text-xs shadow-lg transition-all active:scale-95 uppercase tracking-tighter border-b-4 border-indigo-800">INFORME MES (PDF)</button>
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

        <div className="w-2/3 p-6 bg-slate-100 overflow-y-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 content-start pb-24">
          {PRODUCTS.map((p) => (
            <button key={p.name} onClick={() => agregar(p.name, p.price)} className={`bg-white rounded-3xl shadow-md hover:shadow-2xl border-4 border-white hover:border-indigo-500 active:scale-95 transition-all group relative overflow-hidden flex flex-col h-[220px]`}>
              {/* IMAGE AREA */}
              <div className="flex-1 w-full overflow-hidden bg-slate-100 relative">
                <img src={p.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt={p.name} />
                {/* Clear Price Tag Overlay */}
                <div className="absolute top-3 right-3 bg-indigo-600/90 backdrop-blur-md px-3 py-1 rounded-2xl shadow-xl">
                  <div className="text-white font-black text-sm tracking-tight">{p.price.toFixed(2)} <span className="text-[9px] opacity-70">MAD</span></div>
                </div>
              </div>

              {/* INFO AREA (Professional POS Label) */}
              <div className="p-4 bg-white border-t border-slate-50">
                <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-0.5 line-clamp-1">{p.name.split(' ')[0]}</div>
                <div className="text-sm font-black text-slate-800 uppercase leading-none tracking-tight truncate">{p.name}</div>
              </div>

              {/* Robust Decorative Accent Line */}
              <div className={`h-2 w-full ${p.color.replace('border-', 'bg-')} opacity-80`}></div>
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
    </div >
  );
}

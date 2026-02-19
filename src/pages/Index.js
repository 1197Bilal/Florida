import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useEffect } from "react";
import { PRODUCTS } from "../data/products";
import { supabase } from "../lib/supabaseClient";
export default function Index() {
    const [carrito, setCarrito] = useState([]);
    const [salesHistory, setSalesHistory] = useState(() => {
        const saved = localStorage.getItem("florida_sales_history");
        return saved ? JSON.parse(saved) : [];
    });
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [manualAmount, setManualAmount] = useState("");
    const [reportType, setReportType] = useState(null);
    const [reportFolder, setReportFolder] = useState(null);
    useEffect(() => {
        fetchSales();
    }, []);
    const fetchSales = async () => {
        const { data, error } = await supabase
            .from('sales')
            .select('*')
            .order('timestamp', { ascending: true });
        if (error) {
            console.error('Error fetching sales:', error);
        }
        else if (data) {
            setSalesHistory(data);
        }
    };
    const totalTicket = carrito.reduce((acc, item) => acc + item.price, 0);
    const agregar = (name, price) => {
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
    const pressNum = (num) => {
        if (num === "." && manualAmount.includes("."))
            return;
        setManualAmount(manualAmount + num);
    };
    const eliminarUno = (id) => {
        setCarrito(carrito.filter((item) => item.id !== id));
    };
    const cobrar = async () => {
        if (carrito.length === 0)
            return;
        const now = new Date();
        const items = carrito.map((i) => ({ name: i.name, price: i.price }));
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
        const newSale = {
            id: data ? data[0].id : Date.now(),
            timestamp: now.toISOString(),
            items: items,
            total: totalTicket
        };
        setSalesHistory([...salesHistory, newSale]);
        setCarrito([]);
        alert("Venta realizada y guardada en la nube ✅");
    };
    const printReport = (type) => {
        setReportType(type);
        setTimeout(() => {
            window.print();
            setReportType(null);
        }, 100);
    };
    const salesAtSelectedDate = salesHistory.filter((s) => s.timestamp.startsWith(selectedDate));
    const totalAtSelectedDate = salesAtSelectedDate.reduce((acc, s) => acc + s.total, 0);
    const getMonthlySales = () => {
        const month = selectedDate.substring(0, 7);
        return salesHistory.filter((s) => s.timestamp.startsWith(month));
    };
    const totalMonthly = getMonthlySales().reduce((acc, s) => acc + s.total, 0);
    const descargarTXTParaFichero = (filename, text) => {
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
            const handle = await window.showDirectoryPicker();
            setReportFolder(handle);
            alert("Carpeta de reportes configurada correctamente 📂");
        }
        catch (err) {
            console.error("Error al seleccionar carpeta:", err);
            alert("No se pudo seleccionar la carpeta.");
        }
    };
    const realizarCierre = async () => {
        const todaysSales = salesHistory.filter((s) => s.timestamp.startsWith(selectedDate));
        const totalToday = todaysSales.reduce((acc, s) => acc + s.total, 0);
        const dateParts = selectedDate.split('-');
        const diaStr = dateParts[2];
        const tempDate = new Date(selectedDate + "T12:00:00");
        const mesNombreRaw = tempDate.toLocaleDateString('es-ES', { month: 'long' });
        const mesNombre = mesNombreRaw.charAt(0).toUpperCase() + mesNombreRaw.slice(1);
        let reportContent = `FLORIDA CAFÉ - CIERRE DE CAJA\n`;
        reportContent += `Fecha: ${selectedDate}\nTotal: ${totalToday.toFixed(2)} MAD\n`;
        reportContent += `------------------------------------------\n`;
        todaysSales.forEach((sale, index) => {
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
        }
        else {
            alert(`Cierre del ${selectedDate} guardado en la nube ☁️✅`);
        }
        // 2. Guardar en carpeta local (Opcional, si está configurada)
        if (reportFolder) {
            try {
                const añoStr = dateParts[0];
                const yearFolder = await reportFolder.getDirectoryHandle(añoStr, { create: true });
                const monthFolder = await yearFolder.getDirectoryHandle(mesNombre, { create: true });
                const fileHandle = await monthFolder.getFileHandle(`dia_${diaStr}.txt`, { create: true });
                const writable = await fileHandle.createWritable();
                await writable.write(reportContent);
                await writable.close();
                alert(`También guardado en copia local: ${añoStr}/${mesNombre}/dia_${diaStr}.txt ✅`);
            }
            catch (err) {
                console.error("Error al guardar copia local:", err);
            }
        }
    };
    const descargarReporteMensual = () => {
        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();
        const monthStr = `${year}-${month.toString().padStart(2, '0')}`;
        const monthlySales = salesHistory.filter((s) => s.timestamp.startsWith(monthStr));
        const totalMonth = monthlySales.reduce((acc, s) => acc + s.total, 0);
        let reportContent = `FLORIDA CAFÉ - REPORTE MENSUAL\n`;
        reportContent += `Mes: ${monthStr}\n`;
        reportContent += `------------------------------------------\n`;
        // Agrupar por día
        const salesByDay = {};
        monthlySales.forEach((s) => {
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
    return (_jsxs("div", { className: "h-screen w-full bg-slate-200 flex flex-col font-sans overflow-hidden text-slate-900", children: [reportType && (_jsxs("div", { className: "fixed inset-0 bg-white z-[9999] p-8 print:block hidden text-slate-900 border-8 border-slate-100 h-full overflow-y-auto", children: [_jsxs("div", { className: "flex justify-between items-start border-b-4 border-slate-800 pb-4 mb-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-4xl font-black italic mb-1 uppercase tracking-tighter", children: "FLORIDA CAF\u00C9 \uD83C\uDF34" }), _jsx("p", { className: "text-slate-500 font-bold uppercase tracking-widest text-[10px]", children: "Informe oficial de ventas" })] }), _jsxs("div", { className: "text-right", children: [_jsx("p", { className: "font-black text-xl uppercase", children: reportType === 'daily' ? 'Cierre de Caja' : 'Resumen Mensual' }), _jsx("p", { className: "text-slate-500 font-bold", children: reportType === 'daily' ? selectedDate : selectedDate.substring(0, 7) })] })] }), reportType === 'daily' ? (_jsxs("div", { children: [_jsxs("div", { className: "mb-6 p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl", children: [_jsx("h3", { className: "text-xs font-black uppercase tracking-widest text-slate-400 mb-3 border-b pb-2", children: "Resumen de Productos" }), _jsx("div", { className: "grid grid-cols-2 gap-x-8 gap-y-2", children: Object.entries(salesAtSelectedDate.reduce((acc, s) => {
                                            s.items.forEach((item) => {
                                                acc[item.name] = (acc[item.name] || 0) + 1;
                                            });
                                            return acc;
                                        }, {})).sort().map(([name, qty]) => (_jsxs("div", { className: "flex justify-between text-sm border-b border-slate-100 pb-1", children: [_jsx("span", { className: "font-bold text-slate-700", children: name }), _jsxs("span", { className: "font-black text-indigo-600", children: ["x", qty] })] }, name))) })] }), _jsx("h3", { className: "text-xs font-black uppercase tracking-widest text-slate-400 mb-2 mt-8", children: "Detalle Cronol\u00F3gico" }), _jsxs("table", { className: "w-full text-left", children: [_jsx("thead", { className: "border-b-2 border-slate-300 uppercase text-[10px] font-black text-slate-400", children: _jsxs("tr", { children: [_jsx("th", { className: "py-2", children: "Hora" }), _jsx("th", { children: "Concepto" }), _jsx("th", { className: "text-right", children: "Importe" })] }) }), _jsx("tbody", { className: "text-sm", children: salesAtSelectedDate.map((s, idx) => (_jsxs(React.Fragment, { children: [_jsxs("tr", { className: "bg-slate-50 font-bold border-t border-slate-100", children: [_jsx("td", { className: "py-2", children: new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }), _jsxs("td", { children: ["VENTA #", idx + 1] }), _jsxs("td", { className: "text-right font-black text-indigo-700", children: [s.total.toFixed(2), " MAD"] })] }), s.items.map((item, iidx) => (_jsxs("tr", { className: "text-slate-500 text-[10px]", children: [_jsx("td", {}), _jsxs("td", { className: "pl-4 pb-1", children: ["- ", item.name] }), _jsxs("td", { className: "text-right", children: [item.price.toFixed(2), " MAD"] })] }, iidx)))] }, s.id))) })] }), _jsxs("div", { className: "mt-8 pt-4 border-t-4 border-slate-800 flex justify-between items-center", children: [_jsx("span", { className: "text-2xl font-black uppercase tracking-tighter", children: "Total del d\u00EDa:" }), _jsxs("span", { className: "text-4xl font-black", children: [totalAtSelectedDate.toFixed(2), " MAD"] })] })] })) : (_jsxs("div", { children: [_jsxs("table", { className: "w-full text-left border-collapse", children: [_jsx("thead", { className: "border-b-2 border-slate-300 uppercase text-[10px] font-black text-slate-400", children: _jsxs("tr", { children: [_jsx("th", { className: "py-2 border-r pr-4", children: "Fecha" }), _jsx("th", { className: "text-right", children: "Total D\u00EDa" })] }) }), _jsx("tbody", { className: "text-sm", children: Object.entries(getMonthlySales().reduce((acc, s) => {
                                            const day = s.timestamp.split('T')[0];
                                            acc[day] = (acc[day] || 0) + s.total;
                                            return acc;
                                        }, {})).sort().map(([day, total]) => (_jsxs("tr", { className: "border-b border-slate-100", children: [_jsx("td", { className: "py-2 font-bold border-r pr-4", children: day }), _jsxs("td", { className: "text-right font-black", children: [total.toFixed(2), " MAD"] })] }, day))) })] }), _jsxs("div", { className: "mt-8 pt-4 border-t-4 border-slate-800 flex justify-between items-center", children: [_jsx("span", { className: "text-2xl font-black uppercase tracking-tighter", children: "Total Mes:" }), _jsxs("span", { className: "text-4xl font-black", children: [totalMonthly.toFixed(2), " MAD"] })] })] })), _jsxs("div", { className: "mt-12 text-[10px] text-slate-400 border-t pt-4 flex justify-between italic", children: [_jsx("span", { children: "Florida Caf\u00E9 POS - Software de gesti\u00F3n" }), _jsxs("span", { children: ["Generado el: ", new Date().toLocaleString()] })] })] })), _jsxs("header", { className: "bg-slate-800 text-white p-3 flex justify-between items-center shadow-md print:hidden", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx("h1", { className: "font-black italic text-xl uppercase tracking-tighter", children: "FLORIDA CAF\u00C9 \uD83C\uDF34" }), _jsxs("div", { className: "bg-slate-700 p-1 px-3 rounded-xl border border-slate-600 flex items-center gap-2 group", children: [_jsx("span", { className: "text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-indigo-400 transition-colors", children: "Historial:" }), _jsx("input", { type: "date", value: selectedDate, onChange: (e) => setSelectedDate(e.target.value), className: "bg-transparent text-sm font-black focus:outline-none cursor-pointer uppercase tracking-tighter" })] })] }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { onClick: seleccionarCarpeta, className: `${reportFolder ? 'bg-emerald-600' : 'bg-orange-600'} hover:opacity-90 px-4 py-2 rounded-xl font-black text-xs shadow-lg transition-all active:scale-95 uppercase tracking-tighter flex items-center gap-2`, children: reportFolder ? '📁 CARPETA OK' : '📁 CONFIG. CARPETA' }), _jsx("button", { onClick: realizarCierre, className: "bg-red-600 hover:bg-red-500 px-4 py-2 rounded-xl font-black text-xs shadow-lg transition-all active:scale-95 uppercase tracking-tighter border-b-4 border-red-800", children: "CIERRE D\u00CDA (GUARDAR)" }), _jsx("button", { onClick: () => printReport('daily'), className: "bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-xl font-black text-xs shadow-lg transition-all active:scale-95 uppercase tracking-tighter border-b-4 border-slate-900", children: "IMPRIMIR TICKET D\u00CDA" }), _jsx("button", { onClick: () => printReport('monthly'), className: "bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-xl font-black text-xs shadow-lg transition-all active:scale-95 uppercase tracking-tighter border-b-4 border-indigo-800", children: "INFORME MES (PDF)" })] })] }), _jsxs("div", { className: "flex flex-1 overflow-hidden", children: [_jsxs("div", { className: "w-1/3 bg-white border-r-2 border-slate-300 flex flex-col", children: [_jsxs("div", { className: "bg-slate-800 p-2 text-white text-[10px] font-bold flex justify-between uppercase tracking-widest", children: [_jsx("span", { children: "Ticket Actual" }), _jsx("span", { className: "text-emerald-400 italic font-black", children: "Venta Abierta" })] }), _jsx("div", { className: "flex-1 overflow-y-auto bg-slate-50 shadow-inner", children: carrito.length === 0 ? (_jsxs("div", { className: "h-full flex flex-col items-center justify-center text-slate-300 p-10 text-center gap-4 group", children: [_jsx("div", { className: "w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-4xl group-hover:scale-110 transition-transform duration-500", children: "\u2615" }), _jsxs("p", { className: "font-bold text-xs uppercase tracking-widest leading-relaxed", children: ["Carrito vac\u00EDo", _jsx("br", {}), "Selecciona un producto"] })] })) : (carrito.map((item) => (_jsxs("div", { className: "flex justify-between p-3 border-b border-slate-200 items-center animate-in fade-in slide-in-from-left-2 duration-200 hover:bg-white transition-colors", children: [_jsx("button", { onClick: () => eliminarUno(item.id), className: "w-10 h-10 flex items-center justify-center bg-red-50 text-red-500 rounded-xl font-bold transition-all hover:bg-red-500 hover:text-white active:scale-90 shadow-sm", children: "\u2715" }), _jsxs("div", { className: "flex-1 px-4", children: [_jsx("div", { className: "text-base font-black text-slate-800 uppercase tracking-tight leading-4", children: item.name }), _jsxs("div", { className: "flex items-center gap-1 text-[11px] text-indigo-500 font-black bg-indigo-50 w-fit px-2 py-0.5 rounded-full mt-1.5 shadow-sm", children: [_jsx("span", { className: "opacity-70 text-[10px]", children: "\uD83D\uDD52" }), " ", item.time] })] }), _jsxs("span", { className: "font-black text-indigo-700 text-xl tracking-tighter", children: [item.price.toFixed(2), " ", _jsx("span", { className: "text-[10px]", children: "MAD" })] })] }, item.id)))) }), _jsxs("div", { className: "bg-slate-200 p-3 border-t-2 border-slate-300 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]", children: [_jsxs("div", { className: "bg-white p-2 mb-3 text-right text-3xl font-mono border-4 border-indigo-100 rounded-2xl shadow-inner h-16 flex items-center justify-end group", children: [_jsx("span", { className: "text-slate-300 group-hover:text-slate-400 transition-colors mr-auto text-[10px] font-black uppercase tracking-tighter ml-2", children: "Manual:" }), _jsx("span", { className: "font-black text-indigo-700", children: manualAmount || "0.00" }), _jsx("span", { className: "ml-2 text-xs text-slate-400 font-bold uppercase", children: "MAD" })] }), _jsxs("div", { className: "grid grid-cols-4 gap-2", children: [[1, 2, 3, 4, 5, 6, 7, 8, 9, 0, "."].map(n => (_jsx("button", { onClick: () => pressNum(n.toString()), className: "bg-white py-4 rounded-xl shadow-md text-xl font-black active:scale-95 transition-all hover:bg-slate-50 border-b-4 border-slate-100", children: n }, n))), _jsx("button", { onClick: () => setManualAmount(""), className: "bg-white py-4 rounded-xl shadow-md text-xl font-black text-orange-600 active:scale-95 hover:bg-orange-50 transition-all border-b-4 border-orange-100 font-mono", children: "C" }), _jsx("button", { onClick: agregarManual, className: "col-span-4 bg-indigo-600 text-white py-4 rounded-2xl font-black mt-2 shadow-xl hover:bg-indigo-500 active:scale-95 transition-all text-xs uppercase tracking-widest border-b-[6px] border-indigo-800", children: "A\u00D1ADIR IMPORTE LIBRE" })] })] }), _jsx("div", { className: "bg-slate-900 p-4 text-white", children: _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-sm font-bold text-slate-400 uppercase tracking-widest", children: "Total" }), _jsxs("span", { className: "text-5xl font-black text-emerald-400", children: [totalTicket.toFixed(2), " ", _jsx("span", { className: "text-xl", children: "MAD" })] })] }) })] }), _jsx("div", { className: "w-2/3 p-6 bg-slate-100 overflow-y-auto grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 content-start pb-24", children: PRODUCTS.map((p) => (_jsxs("button", { onClick: () => agregar(p.name, p.price), className: `bg-white rounded-3xl shadow-sm hover:shadow-xl border-2 border-transparent hover:border-indigo-500 active:scale-95 transition-all group relative overflow-hidden flex flex-col h-full bg-gradient-to-b from-white to-slate-50`, children: [_jsx("div", { className: "aspect-square w-full overflow-hidden bg-slate-200", children: _jsx("img", { src: p.image, className: "w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 aspect-square", alt: p.name }) }), _jsxs("div", { className: "p-4 flex flex-col flex-1 text-left", children: [_jsx("div", { className: "text-[10px] font-black uppercase text-indigo-500 tracking-widest mb-1 opacity-80", children: p.name.split(' ')[0] }), _jsx("div", { className: "text-sm font-black text-slate-800 uppercase leading-tight mb-2 flex-grow", children: p.name }), _jsxs("div", { className: "flex justify-between items-end", children: [_jsx("div", { className: "text-slate-400 text-[10px] font-bold", children: "Importe:" }), _jsxs("div", { className: "text-indigo-600 font-black text-xl tracking-tighter", children: [p.price.toFixed(2), " ", _jsx("span", { className: "text-[10px] ml-0.5", children: "MAD" })] })] })] }), _jsx("div", { className: `h-1.5 w-full ${p.color.replace('border-', 'bg-')}` })] }, p.name))) })] }), _jsx("footer", { className: "bg-slate-900 px-8 py-4 shadow-[0_-15px_40px_rgba(0,0,0,0.4)] print:hidden relative z-10 flex justify-center", children: _jsxs("button", { onClick: cobrar, className: "w-full max-w-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-black py-4 rounded-2xl text-2xl shadow-lg transition-all active:scale-95 uppercase tracking-widest border-b-[4px] border-emerald-700 flex items-center justify-center gap-3", children: [_jsx("span", { className: "text-sm opacity-50 font-normal", children: "Finalizar ticket y" }), "REALIZAR VENTA"] }) })] }));
}

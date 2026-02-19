import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export const CashClosureDialog = (props) => {
    if (!props.open)
        return null;
    return (_jsxs("div", { style: { position: 'fixed', top: '20%', background: 'white', color: 'black', padding: '20px', border: '1px solid black' }, children: [_jsx("h2", { children: "Cerrar Caja" }), _jsx("button", { onClick: props.onConfirm, children: "Confirmar" }), _jsx("button", { onClick: () => props.onOpenChange(false), children: "Cancelar" })] }));
};

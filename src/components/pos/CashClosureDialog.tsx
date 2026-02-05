export const CashClosureDialog = (props: any) => {
  if (!props.open) return null;
  return (
    <div style={{position: 'fixed', top: '20%', background: 'white', color: 'black', padding: '20px', border: '1px solid black'}}>
      <h2>Cerrar Caja</h2>
      <button onClick={props.onConfirm}>Confirmar</button>
      <button onClick={() => props.onOpenChange(false)}>Cancelar</button>
    </div>
  );
};
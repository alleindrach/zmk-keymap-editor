import "./DialogBox.css"
export default function DialogBox(props) {
  const { dismissText = 'Ok', onDismiss, children } = props

  return (
    <div className="dialog">
      {children}
      {dismissText && (
        <button className="button" onClick={onDismiss}>
          {dismissText}
        </button>
      )}
    </div>
  )
}

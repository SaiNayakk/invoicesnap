import { Fragment } from "react";

/**
 * Renders message text the way WhatsApp does: *bold*, and payment links as
 * links. `onPay` makes payment links open in place (the demo phone).
 */
export function WhatsAppText({ text, onPay, host }: { text: string; onPay?: (id: string) => void; host?: string }) {
  const parts = text.split(/(\*[^*\n]+\*|(?:https?:\/\/[^\s]+)?\/pay\/[a-z0-9]{15})/g);
  return (
    <>
      {parts.map((p, i) => {
        const pay = p.match(/\/pay\/([a-z0-9]{15})$/);
        if (pay) {
          const label = p.startsWith("/") && host ? `${host}${p}` : p;
          return onPay
            ? <button key={i} onClick={() => onPay(pay[1])} className="break-all text-left text-sky-300 underline">{label}</button>
            : <a key={i} href={`/pay/${pay[1]}`} target="_blank" rel="noreferrer" className="break-all text-sky-300 underline">{label}</a>;
        }
        if (/^\*[^*]+\*$/.test(p)) return <b key={i}>{p.slice(1, -1)}</b>;
        return <Fragment key={i}>{p}</Fragment>;
      })}
    </>
  );
}

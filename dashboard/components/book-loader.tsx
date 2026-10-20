import './book-loader.css';
// Adapted from the user-supplied Uiverse.io animation by anand_4957.
export function BookLoader({label='Loading…'}:{label?:string}){return <div className="atlas-book-loader" role="status"><div className="atlas-book" aria-hidden="true"><div className="atlas-book__pg-shadow"/>{[1,2,3,4,5].map(n=><div key={n} className={'atlas-book__pg'+(n>1?' atlas-book__pg--'+n:'')}/>)}</div><span>{label}</span></div>;}

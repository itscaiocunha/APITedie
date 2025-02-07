// 'use client';
// import Image from "next/image";
// import { useState } from "react";

// export default function Page() {
//   const [message, setMessage] = useState("");
//   const [products, setProducts] = useState([]);

//   const handleSend = async () => {
//     // Simulate fetching products based on the message
//     const response = await fetch("/api/julia", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({ message: message }),
//     });
//     const data = await response.json();

//     setProducts(data);
//   };

//   return (
//     <div>
//       <div style={{ border: "1px solid #ccc", padding: "10px", marginBottom: "10px" }}>
//         <input
//           type="text"
//           value={message}
//           onChange={(e) => setMessage(e.target.value)}
//           placeholder="Type your message"
//           style={{ width: "80%", padding: "10px" }}
//         />
//         <button onClick={handleSend} style={{ padding: "10px" }}>
//           Send
//         </button>
//       </div>
//       <div>
//         {products.length > 0 && (
//           <div>
//             <h2>Products</h2>
//             <div style={{ display: "flex", flexWrap: "wrap" }}>
//               {products.map((product) => (
//                 <div key={product.ProdutoID} style={{ border: "1px solid #ccc", margin: "10px", padding: "10px" }}>
//                   <h3>{product.Nome}</h3>
//                   <p>{product.Descricao}</p>
//                   <p>$teste</p>
//                 </div>
//               ))}
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }
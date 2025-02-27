import { NextResponse } from "next/server";

const MELHOR_ENVIO_URL = "https://www.melhorenvio.com.br/api/v2/me/shipment/calculate";
const MELHOR_ENVIO_TOKEN = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxIiwianRpIjoiYmMwNTRmOWU4ODJkNGY5ZDFlY2M2ZmUyZTY0YjVmNDgwZmNhYzhiYWFhNTgxN2U5ODgzZWY5NDMyYWEyNDEwYjU5YTI4OTE1MjAyZGY4NzAiLCJpYXQiOjE3NDA2NjEwMjkuODU3MTE1LCJuYmYiOjE3NDA2NjEwMjkuODU3MTE4LCJleHAiOjE3NzIxOTcwMjkuODQ0NTI0LCJzdWIiOiI5ZTRmZDZjNy1iODU2LTQ2MzMtOTY5Mi1jZmZkZmYxZjBjNjYiLCJzY29wZXMiOlsic2hpcHBpbmctY2FsY3VsYXRlIl19.ELY1Cc5vNKGe8cCPbb3wY_JZ4or-Z9Bj3XfDoinkuUbOEE0csJHHJ5zh1a2D13Ki6D17INvt6wkdBsrtoVmy5cM-9ssq456UOfqZZIlKbiUDEIdYCtsAg7Oa26S-eBA7Uw7c2z_4sDEnh6PB_QsX6npPSgYQF7RSm4LcEQbIBCfrdM5lInUdP0Ry0YHG3DCUQWkI03gEt5GGp_QWCu3hPuwgAjSvCduccxHZLS0bgQLidBVCDlh0PmKKN4W5rO6AKlfW3GIXoSlelwtZetjT69LRUE10FnvdLWHPnfdOvfOhAQxC8UvXPXAbRjz1gBzY-pkqdPVkETVsloQlhF70GjJtwYLdQ9I-99Xra0HNPknGJQgXr-D7XQLpgkbXbOPQIygpgU6HT57ykVtS3K3-YHLV8KdtALhKR1uER9bMicAnp1EwRNV2xs-B1_L1N-_4_p7pyQ6-0TVpNMpi0I8bXSl2xbNXd_oYCc1cyNOWcwLXV_C07AWuzisrZ5IWMFS-KQIltidqFVOSIFQTIFz51_DxGSfqPzw6RdSNqPM-m58ZN50PdQt1rKtRW29_rywxEw5xgDC4DjkWUESbxbSWpWdgIrxl5GVtDNSZ8UpX_j69zP-jpElEh-LKwIOrizCsF1dcUthQAOLxzru0xokFTHS5N8sStRgfVdQSkhdSWkI"; // 🔥 Substitua pelo token correto

const headers = {
  "Access-Control-Allow-Origin": "*", // Permite qualquer origem
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS", // Métodos permitidos
  "Access-Control-Allow-Headers": "Content-Type, Authorization", // Cabeçalhos permitidos
};

export async function POST(req) {
  try {
    const body = await req.json();

    const response = await fetch(MELHOR_ENVIO_URL, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Authorization": `Bearer ${MELHOR_ENVIO_TOKEN}`,
        "Content-Type": "application/json",
        "User-Agent": "Aplicação tedie-api",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.ok ? 200 : response.status, headers });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao calcular frete" }, { status: 500, headers });
  }
}

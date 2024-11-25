import { cookies } from "next/headers";
import axios from "axios";

export const metadata = {
  title: "Cart",
};

async function getCart() {
  try {
    const token = cookies().get(process.env.JWT_SECRET)?.value;

    if (!token) {
      throw new Error("You must be logged in");
    }
    const res = await axios.get(`${process.env.API_BASE_URL}/cart/myCart`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    return res?.data;
  } catch (err) {
    return err.response.data.message;
  }
}

async function Page() {
  const cart = await getCart();

  return <div className=""></div>;
}

export default Page;
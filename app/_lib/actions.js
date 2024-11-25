"use server";

import axios from "axios";
import { cookies } from "next/headers";
import { signup } from "../_services/auth-api";
import { JWT_EXPIRES } from "../_utils/constants";
import { signIn, signOut } from "./auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function signInAction() {
  await signIn("google", {
    redirectTo: "/account",
  });
}

export async function signOutAction() {
  cookies().delete(process.env.JWT_SECRET);
  await signOut({ redirectTo: "/" });
}

export async function signupAction(payload) {
  const token = (await signup(payload))?.data?.token;
  cookies().set({
    name: process.env.JWT_SECRET,
    value: token,
    expires: JWT_EXPIRES,
  });
}

export async function loginAction(payload) {
  try {
    const response = await axios.post(
      `${process.env.API_BASE_URL}/auth/login`,
      {
        ...payload,
        google: false,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data.status === "success") {
      const token = response?.data.token;
      cookies().set({
        name: process.env.JWT_SECRET,
        value: token,
        expires: JWT_EXPIRES,
      });
    }

    return response.data;
  } catch (err) {
    return err.response.data;
  }
}

export async function getUserToken() {
  const token = cookies().get(process.env.JWT_SECRET);

  return !!token;
}

export async function getMe() {
  try {
    const token = cookies().get(process.env.JWT_SECRET)?.value;

    const response = await axios.get(`${process.env.API_BASE_URL}/user/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    return response.data;
  } catch {
    return false;
  }
}

export async function updateUser(formData) {
  const token = cookies().get(process.env.JWT_SECRET)?.value;

  if (!token) {
    throw new Error("You must be logged in");
  }

  const email = formData.get("email");
  const fullName = formData.get("fullName");
  const phone = formData.get("phone");

  if (phone && phone.length !== 11) {
    throw new Error("Please write a valid phone number");
  }

  if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
    throw new Error("Please write a valid email");
  }

  const updateData = { email, fullName, phone };

  const response = await axios.patch(
    `${process.env.API_BASE_URL}/user/updateMe`,
    updateData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (response.data.status === "success") {
    revalidatePath("/account/profile");
  }

  return response.data;
}

export async function cancelOrder(orderId) {
  const token = cookies().get(process.env.JWT_SECRET)?.value;

  if (!token) {
    throw new Error("You must be logged in");
  }

  const res = await axios.patch(
    `${process.env.API_BASE_URL}/order/${orderId}`,
    { canceled: true },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (res.data.status === "success") {
    revalidatePath("/account/orders");
  }

  return res.data;
}

export async function updateOrder(formData) {
  const token = cookies().get(process.env.JWT_SECRET)?.value;

  if (!token) {
    throw new Error("You must be logged in");
  }

  const address = {
    street: formData.get("street"),
    postalCode: formData.get("postalCode"),
    text: formData.get("addressText"),
  };

  const updateData = {
    phone: formData.get("phone"),
    address,
    text: formData.get("text"),
  };

  const id = formData.get("orderId");

  const res = await axios.patch(
    `${process.env.API_BASE_URL}/order/${id}`,
    updateData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (res.data.status === "success") {
    revalidatePath(`/account/orders/edit/${id}`);
    revalidatePath("/account/orders");

    redirect("/account/orders");
  }

  return res.data;
}

export async function addPizzaToCart(payload) {
  const token = cookies().get(process.env.JWT_SECRET)?.value;

  if (!token) {
    throw new Error("You must be logged in");
  }
  const response = await axios.post(
    `${process.env.API_BASE_URL}/cart`,
    payload,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data;
}

export async function removePizzaFromCart(id) {
  try {
    const token = cookies().get(process.env.JWT_SECRET)?.value;

    if (!token) {
      throw new Error("You must be logged in");
    }

    const res = await axios.delete(
      `${process.env.API_BASE_URL}/cart/deletePizza/${id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return res.data;
  } catch (err) {
    console.log(err.response.data);
  }
}

export async function deleteCart(id) {
  const token = cookies().get(process.env.JWT_SECRET)?.value;

  if (!token) {
    throw new Error("You must be logged in");
  }

  const res = await axios.delete(`${process.env.API_BASE_URL}/cart/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  return res.data;
}
export async function getCart() {
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

    if (res.data.status === "success") return res.data;
    if (res.data.status === "fail") return "your cart is empty";
  } catch (err) {
    return err.response.data.message;
  }
}

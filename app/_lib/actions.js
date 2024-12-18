"use server";

import axios from "axios";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { JWT_EXPIRES } from "../_utils/constants";
import { signIn, signOut } from "./auth";

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
  try {
    const response = await axios.post(
      `${process.env.API_BASE_URL}/auth/signup`,
      { ...payload, google: false },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (response?.data?.status === "success") {
      const token = response?.data.token;
      cookies().set({
        name: process.env.JWT_SECRET,
        value: token,
        expires: JWT_EXPIRES,
      });
    }

    return response?.data;
  } catch (err) {
    if (err.response) {
      return err.response.data.message || "An error occurred!";
    } else if (err.request) {
      return "No response from the server!";
    }
  }
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

    if (response?.data?.status === "success") {
      const token = response?.data.token;
      cookies().set({
        name: process.env.JWT_SECRET,
        value: token,
        expires: JWT_EXPIRES,
      });
    }

    return response?.data;
  } catch (err) {
    if (err.response) {
      return err.response.data.message || "An error occurred!";
    } else if (err.request) {
      return "No response from the server!";
    }
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
  } catch (err) {
    if (err.response) {
      return err.response.data.message || "An error occurred!";
    } else if (err.request) {
      return "No response from the server!";
    }
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
    postalCode: formData.get("postalCode"),
    text: formData.get("addressText"),
  };

  const updateData = {
    phone: formData.get("phone"),
    address,
    text: formData.get("text"),
  };

  for (const [key, value] of Object.entries(updateData)) {
    if (value.length < 1) {
      delete updateData[key];
    }
  }

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

  if (res?.data.status === "success") {
    revalidatePath(`/account/orders/edit/${id}`);
    revalidatePath("/account/orders");

    redirect("/account/orders");
  }
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

  revalidatePath("/cart");

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
    revalidatePath("/cart");

    return res.data;
  } catch (err) {}
}

export async function deleteCart(id) {
  try {
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

    revalidatePath("/cart");

    return res.data;
  } catch (err) {
    if (err.response) {
      return err.response.data.message || "An error occurred!";
    } else if (err.request) {
      return "No response from the server!";
    }
  }
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
    if (err.response) {
      return err.response.data.message || "An error occurred!";
    } else if (err.request) {
      return "No response from the server!";
    }
  }
}

export async function ratePizzaById(id, rate) {
  try {
    const token = cookies().get(process.env.JWT_SECRET)?.value;

    if (!token) {
      throw new Error("You must be logged in");
    }

    const res = await axios.put(
      `${process.env.API_BASE_URL}/pizza/${id}`,
      { rate: rate },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    revalidatePath(`/menu/${id}`);

    return res.data;
  } catch (err) {
    if (err.response) {
      return err.response.data.message || "An error occurred!";
    } else if (err.request) {
      return "No response from the server!";
    }
  }
}

export async function createOrder(payload) {
  const token = cookies().get(process.env.JWT_SECRET)?.value;

  if (!token) {
    throw new Error("You must be logged in");
  }

  const res = await axios.post(`${process.env.API_BASE_URL}/order`, payload, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (res?.data.status === "success") {
    revalidatePath(
      `/payment/${payload.isPaid === true ? "online" : "offline"}`
    );
    redirect("/success");
  }

  return res?.data;
}

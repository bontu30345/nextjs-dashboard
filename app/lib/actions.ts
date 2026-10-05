'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import postgres from 'postgres';
import { auth, signIn } from '@/auth';
import { AuthError } from 'next-auth';

const sql = postgres(process.env.POSTGRES_URL!, {
  ssl: 'require',
});

const FormSchema = z.object({
  id: z.string(),

  customerId: z.string({
    invalid_type_error: 'Please select a customer.',
  }),

  amount: z.coerce
    .number()
    .gt(0, {
      message: 'Please enter an amount greater than $0.',
    }),

  status: z.enum(['pending', 'paid'], {
    invalid_type_error: 'Please select an invoice status.',
  }),

  date: z.string(),
});

const CreateInvoice = FormSchema.omit({
  id: true,
  date: true,
});

const UpdateInvoice = FormSchema.omit({
  id: true,
  date: true,
});

export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};

async function requireAuthenticatedUser() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }
}

/* -------------------------
   CREATE INVOICE
------------------------- */

export async function createInvoice(
  prevState: State,
  formData: FormData,
) {
  await requireAuthenticatedUser();

  const validatedFields = CreateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Invoice.',
    };
  }

  const { customerId, amount, status } = validatedFields.data;

  const amountInCents = amount * 100;

  const date = new Date().toISOString().split('T')[0];

  try {
    await sql`
      INSERT INTO invoices (customer_id, amount, status, date)
      VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
    `;
  } catch (error) {
    console.error(error);

    return {
      message: 'Database Error: Failed to Create Invoice.',
    };
  }

  revalidatePath('/dashboard/invoices');

  redirect('/dashboard/invoices');
}

/* -------------------------
   UPDATE INVOICE
------------------------- */

export async function updateInvoice(
  id: string,
  prevState: State,
  formData: FormData,
) {
  await requireAuthenticatedUser();

  const validatedFields = UpdateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Update Invoice.',
    };
  }

  const { customerId, amount, status } = validatedFields.data;

  const amountInCents = amount * 100;

  try {
    await sql`
      UPDATE invoices
      SET
        customer_id = ${customerId},
        amount = ${amountInCents},
        status = ${status}
      WHERE id = ${id}
    `;
  } catch (error) {
    console.error(error);

    return {
      message: 'Database Error: Failed to Update Invoice.',
    };
  }

  revalidatePath('/dashboard/invoices');

  redirect('/dashboard/invoices');
}

/* -------------------------
   DELETE INVOICE
------------------------- */

export async function deleteInvoice(id: string) {
  await requireAuthenticatedUser();

  const validatedId = z.string().uuid().safeParse(id);

  if (!validatedId.success) {
    throw new Error('Invalid invoice ID.');
  }

  try {
    await sql`DELETE FROM invoices WHERE id = ${validatedId.data}`;
  } catch {
    throw new Error('Failed to delete invoice.');
  }

  revalidatePath('/dashboard/invoices');
}

/* -------------------------
   AUTHENTICATE
------------------------- */

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    await signIn('credentials', formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials.';
        default:
          return 'Something went wrong.';
      }
    }

    throw error;
  }
}
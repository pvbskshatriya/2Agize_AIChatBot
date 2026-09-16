import type { AuthContext, RequestContext } from "../ai/types.js";
import { medusaClient } from "./medusa.client.js";
import { MedusaHttpError } from "./errors.js";

type Employee = {
  company_id?: string;
  company?: { id?: string; name?: string };
};

type StoreCustomer = {
  id: string;
  email?: string;
  first_name?: string | null;
  last_name?: string | null;
  employee?: Employee | null;
};

export async function resolveAuthContext(
  token: string | undefined,
  requestId: string
): Promise<AuthContext> {
  if (!token) {
    return {};
  }

  try {
    const { customer } = await medusaClient.getCustomerMe(
      { fields: "*employee,*employee.company" },
      { token, requestId }
    );
    const me = customer as StoreCustomer | undefined;
    if (!me?.id) {
      return { customerToken: token };
    }

    return {
      customerToken: token,
      customerId: me.id,
      companyId: me.employee?.company?.id || me.employee?.company_id,
      companyName: me.employee?.company?.name,
    };
  } catch (error) {
    if (error instanceof MedusaHttpError && error.code === "UNAUTHORIZED") {
      return {};
    }
    return { customerToken: token };
  }
}

export async function getAuthenticatedCustomer(context: RequestContext) {
  if (!context.customerToken) {
    return null;
  }

  const { customer } = await medusaClient.getCustomerMe(
    { fields: "*employee,*employee.company" },
    { token: context.customerToken, requestId: context.requestId }
  );

  return customer as StoreCustomer;
}

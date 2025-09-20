import { NextRequest, NextResponse } from "next/server";
import { getClientWithTokens } from "@/lib/xero";

export async function GET(req: NextRequest) {
  const tenantId = new URL(req.url).searchParams.get("tenantId")!;
  
  if (!tenantId) {
    return NextResponse.json({ error: "tenantId is required" }, { status: 400 });
  }
  
  try {
    const { xero, tenantId: tid } = await getClientWithTokens(tenantId);
    
    // Extract only the necessary data from tenants to avoid circular references
    const connections = xero.tenants?.map(tenant => ({
      tenantId: tenant.tenantId,
      tenantType: tenant.tenantType,
      tenantName: tenant.tenantName,
      authEventId: tenant.authEventId,
      createdDateUtc: tenant.createdDateUtc,
      updatedDateUtc: tenant.updatedDateUtc
    })) || [];
    
    // Accounting Organisations (requires suitable Accounting read scope; if omitted you'll see 401)
    let organisation = null;
    try {
      console.log(`Making API call to getOrganisations for tenant: ${tid}`);
      const orgResponse = await xero.accountingApi.getOrganisations(tid);
      console.log('API call successful:', {
        statusCode: orgResponse.response?.status,
        organisationCount: orgResponse.body?.organisations?.length || 0,
        organisationNames: orgResponse.body?.organisations?.map(org => org.name) || []
      });
      organisation = {
        organisations: orgResponse.body?.organisations?.map(org => ({
          organisationID: org.organisationID,
          name: org.name,
          legalName: org.legalName,
          shortCode: org.shortCode,
          countryCode: org.countryCode,
          baseCurrency: org.baseCurrency,
          organisationStatus: org.organisationStatus,
          isDemoCompany: org.isDemoCompany,
          createdDateUTC: org.createdDateUTC,
          endOfYearLockDate: org.endOfYearLockDate,
          taxNumber: org.taxNumber,
          financialYearEndDay: org.financialYearEndDay,
          financialYearEndMonth: org.financialYearEndMonth,
          salesTaxBasis: org.salesTaxBasis,
          salesTaxPeriod: org.salesTaxPeriod,
          defaultSalesTax: org.defaultSalesTax,
          defaultPurchasesTax: org.defaultPurchasesTax,
          periodLockDate: org.periodLockDate,
          timezone: org.timezone,
          organisationEntityType: org.organisationEntityType,
          registrationNumber: org.registrationNumber
        })) || []
      };
    } catch (orgError: any) {
      organisation = {
        error: orgError?.response?.status || 500,
        message: orgError?.message || "Failed to fetch organisations",
        details: orgError?.toString?.() || "Unknown error"
      };
    }
    
    return NextResponse.json({ 
      connections, 
      organisation,
      tenantId: tid,
      success: true
    });
  } catch (error: any) {
    console.error("Demo API error:", error);
    return NextResponse.json({ 
      error: error.message || "Failed to fetch data",
      details: error.toString()
    }, { status: 500 });
  }
}

// ============================================================
// PDF generation for BANKI KYC reports
// Uses jsPDF for server-side compatible PDF creation
// ============================================================

import type { ApplicationData } from '@/types';

export function generateKYCPDFContent(application: ApplicationData): string {
  // Returns HTML that can be printed/converted to PDF on client side
  const products = application.selectedProducts
    ? JSON.parse(application.selectedProducts)
    : [];

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>BANKI Account Application - ${application.customerId}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #1a1a1a; }
    .header { text-align: center; border-bottom: 3px solid #06B6D4; padding-bottom: 20px; margin-bottom: 30px; }
    .logo { font-size: 36px; font-weight: bold; color: #06B6D4; }
    .subtitle { color: #666; font-size: 14px; }
    .customer-id { background: #06B6D4; color: white; padding: 10px 20px; border-radius: 8px; display: inline-block; font-size: 18px; font-weight: bold; margin: 10px 0; }
    .section { margin-bottom: 25px; }
    .section-title { font-size: 16px; font-weight: bold; color: #06B6D4; border-bottom: 1px solid #e0e0e0; padding-bottom: 5px; margin-bottom: 15px; }
    .field-row { display: flex; margin-bottom: 8px; }
    .field-label { width: 180px; font-weight: bold; color: #555; font-size: 13px; }
    .field-value { flex: 1; font-size: 13px; }
    .status-badge { padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
    .status-submitted { background: #dcfce7; color: #166534; }
    .status-approved { background: #dbeafe; color: #1e40af; }
    .status-rejected { background: #fee2e2; color: #991b1b; }
    .verification-item { display: flex; align-items: center; margin-bottom: 8px; }
    .check { color: #16a34a; font-size: 18px; margin-right: 10px; }
    .cross { color: #dc2626; font-size: 18px; margin-right: 10px; }
    .footer { margin-top: 40px; border-top: 1px solid #e0e0e0; padding-top: 20px; font-size: 11px; color: #888; text-align: center; }
    .products-list { list-style: none; padding: 0; }
    .products-list li { padding: 8px; background: #f0fdfe; border-left: 3px solid #06B6D4; margin-bottom: 8px; font-size: 13px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">BANKI</div>
    <div class="subtitle">AI-Powered Banking Kiosk</div>
    <div class="subtitle">Account Opening Application</div>
    <div class="customer-id">${application.customerId}</div>
    <div class="subtitle">Generated: ${new Date().toLocaleString()}</div>
  </div>

  <div class="section">
    <div class="section-title">Application Status</div>
    <div class="field-row">
      <div class="field-label">Status:</div>
      <div class="field-value">
        <span class="status-badge status-${application.status}">${application.status.toUpperCase()}</span>
      </div>
    </div>
    <div class="field-row">
      <div class="field-label">Application Date:</div>
      <div class="field-value">${new Date(application.createdAt).toLocaleString()}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Personal Information</div>
    <div class="field-row"><div class="field-label">Full Name:</div><div class="field-value">${application.fullName || '-'}</div></div>
    <div class="field-row"><div class="field-label">Date of Birth:</div><div class="field-value">${application.dateOfBirth || '-'}</div></div>
    <div class="field-row"><div class="field-label">Gender:</div><div class="field-value">${application.gender || '-'}</div></div>
    <div class="field-row"><div class="field-label">Phone:</div><div class="field-value">${application.phone || '-'}</div></div>
    <div class="field-row"><div class="field-label">Email:</div><div class="field-value">${application.email || '-'}</div></div>
    <div class="field-row"><div class="field-label">Address:</div><div class="field-value">${application.address || '-'}</div></div>
    <div class="field-row"><div class="field-label">Occupation:</div><div class="field-value">${application.occupation || '-'}</div></div>
    <div class="field-row"><div class="field-label">Monthly Income:</div><div class="field-value">${application.monthlyIncome || '-'}</div></div>
  </div>

  <div class="section">
    <div class="section-title">Identity Verification</div>
    <div class="field-row"><div class="field-label">Document Type:</div><div class="field-value">${application.idDocumentType || '-'}</div></div>
    <div class="field-row"><div class="field-label">Document Number:</div><div class="field-value">${application.idNumber || '-'}</div></div>
    <div class="field-row"><div class="field-label">ID Confidence:</div><div class="field-value">${application.idConfidence ? `${(application.idConfidence * 100).toFixed(1)}%` : '-'}</div></div>
    <div class="field-row"><div class="field-label">Face Match Score:</div><div class="field-value">${application.faceMatchScore ? `${(application.faceMatchScore * 100).toFixed(1)}%` : '-'}</div></div>
    <div class="verification-item">
      <span class="${application.livenessPass ? 'check' : 'cross'}">${application.livenessPass ? '✓' : '✗'}</span>
      Liveness Detection ${application.livenessPass ? 'Passed' : 'Not completed'}
    </div>
  </div>

  ${products.length > 0 ? `
  <div class="section">
    <div class="section-title">Selected Products</div>
    <ul class="products-list">
      ${products.map((p: string) => `<li>${p}</li>`).join('')}
    </ul>
  </div>
  ` : ''}

  <div class="footer">
    <p>This document is an official account opening application generated by BANKI AI Kiosk System.</p>
    <p>Application ID: ${application.id} | Customer ID: ${application.customerId}</p>
    <p>Confidential - For Bank Use Only</p>
  </div>
</body>
</html>`;
}

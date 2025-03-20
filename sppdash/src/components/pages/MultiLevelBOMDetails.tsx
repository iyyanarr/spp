import React, { useState, useEffect } from 'react';
import { useFrappeGetCall } from 'frappe-react-sdk';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const MultiLevelBOMDetails = () => {
  const [itemCode, setItemCode] = useState('');
  const [items, setItems] = useState([]);
  const [masterBatch, setMasterBatch] = useState('');
  const [finalBatch, setFinalBatch] = useState('');

  // Fetch items from ERPNext
  const { data: itemsData, isLoading: isItemsLoading, error: itemsError } = useFrappeGetCall(
    'frappe.client.get_list',
    {
      params: {
        doctype: 'Item',
        fields: ['name', 'item_name'],
        limit_page_length: 100,
      },
    }
  );

  useEffect(() => {
    if (itemsData) {
      setItems(itemsData);
    }
  }, [itemsData]);

  const { data: bomData, isLoading, error } = useFrappeGetCall('spp.api.get_multi_level_bom', {
    params: { item_code: itemCode },
    enabled: !!itemCode,
  });

  const handleFetchBOMDetails = () => {
    if (!itemCode) {
      alert('Please select an item to fetch BOM details.');
      return;
    }
    console.log('Fetching BOM details for:', itemCode);
    // Add logic to fetch BOM details here
  };

  return (
    <div className="bg-gray-50 min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-xl font-bold mb-4">Multi-Level BOM Details</h1>

        {/* Select Field for Items */}
        <div className="mb-4">
          <label htmlFor="itemCode" className="block text-sm font-medium text-gray-700 mb-2">
            Select Item
          </label>
          <select
            id="itemCode"
            value={itemCode}
            onChange={(e) => setItemCode(e.target.value)}
            className="border rounded p-2 w-full"
          >
            <option value="">-- Select an Item --</option>
            {items.map((item) => (
              <option key={item.name} value={item.name}>
                {item.item_name} ({item.name})
              </option>
            ))}
          </select>
          {isItemsLoading && <p className="text-sm text-gray-500 mt-2">Loading items...</p>}
          {itemsError && <p className="text-sm text-red-500 mt-2">Error fetching items: {itemsError.message}</p>}
        </div>

        {/* Fetch Button */}
        <div className="mb-6">
          <Button onClick={handleFetchBOMDetails} className="bg-blue-500 text-white">
            Fetch BOM Details
          </Button>
        </div>

        {/* Master Batch and Final Batch Fields */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="masterBatch" className="block text-sm font-medium text-gray-700 mb-2">
              Master Batch
            </label>
            <Input
              id="masterBatch"
              value={masterBatch}
              onChange={(e) => setMasterBatch(e.target.value)}
              placeholder="Enter Master Batch"
              className="w-full"
            />
          </div>
          <div>
            <label htmlFor="finalBatch" className="block text-sm font-medium text-gray-700 mb-2">
              Final Batch
            </label>
            <Input
              id="finalBatch"
              value={finalBatch}
              onChange={(e) => setFinalBatch(e.target.value)}
              placeholder="Enter Final Batch"
              className="w-full"
            />
          </div>
        </div>

        {isLoading && <p>Loading...</p>}
        {error && <p className="text-red-500">Error: {error.message}</p>}
        {bomData && bomData.message && bomData.message.bom_data && (
          <Card className="mt-4">
            <CardContent>
              <h2 className="text-lg font-semibold">
                BOM: {bomData.message.bom_data.bom_name[0]?.name || 'N/A'}
              </h2>
              <p>Item Name: {bomData.message.bom_data.item_name || 'N/A'}</p>
              <p>Total Quantity: {bomData.message.bom_data.quantity || 'N/A'}</p>
              <p>Total Cost: ₹ {bomData.message.bom_data.total_cost?.toFixed(2) || '0.00'}</p>
              <p>Raw Material Cost: ₹ {bomData.message.bom_data.raw_material_cost?.toFixed(2) || '0.00'}</p>
              <p>Operating Cost: ₹ {bomData.message.bom_data.operating_cost?.toFixed(2) || '0.00'}</p>

              <h3 className="mt-6 text-lg font-bold">Items</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Item Code</TableHead>
                    <TableHead>Item Name</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead>UOM</TableHead>
                    <TableHead className="text-right">Rate</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bomData.message.bom_data.items.map((item, index) => (
                    <TableRow key={item.item_code}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{item.item_code}</TableCell>
                      <TableCell>{item.item_name}</TableCell>
                      <TableCell className="text-right">{item.qty.toFixed(2)}</TableCell>
                      <TableCell>{item.uom}</TableCell>
                      <TableCell className="text-right">₹ {item.rate.toFixed(2)}</TableCell>
                      <TableCell className="text-right">₹ {item.amount.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <h3 className="mt-6 text-lg font-bold">Child BOMs</h3>
              {bomData.message.bom_data.child_boms.map((childBOM) => (
                <Card key={childBOM.bom_name} className="mb-4">
                  <CardContent>
                    <h4 className="font-semibold">BOM Name: {childBOM.bom_name}</h4>
                    <p>Item Name: {childBOM.item_name}</p>
                    <p>Total Quantity: {childBOM.quantity}</p>
                    <p>Total Cost: ₹ {childBOM.total_cost?.toFixed(2) || '0.00'}</p>
                    <p>Operating Cost: ₹ {childBOM.operating_cost?.toFixed(2) || '0.00'}</p>

                    <h5 className="mt-4 font-bold">Items</h5>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>#</TableHead>
                          <TableHead>Item Code</TableHead>
                          <TableHead>Item Name</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>UOM</TableHead>
                          <TableHead>Rate</TableHead>
                          <TableHead>Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {childBOM.items.map((childItem, index) => (
                          <TableRow key={childItem.item_code}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>{childItem.item_code}</TableCell>
                            <TableCell>{childItem.item_name}</TableCell>
                            <TableCell>{childItem.qty}</TableCell>
                            <TableCell>{childItem.uom}</TableCell>
                            <TableCell>₹ {childItem.rate}</TableCell>
                            <TableCell>₹ {childItem.amount}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    <h6 className="mt-4 font-bold">Operations</h6>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>#</TableHead>
                          <TableHead>Operation</TableHead>
                          <TableHead>Workstation</TableHead>
                          <TableHead>Time (mins)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {childBOM.operations.map((operation, index) => (
                          <TableRow key={operation.name}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>{operation.operation}</TableCell>
                            <TableCell>{operation.workstation}</TableCell>
                            <TableCell>{operation.time_in_mins.toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MultiLevelBOMDetails;

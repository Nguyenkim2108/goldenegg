import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { UpdateEggRequest, CreateLinkRequest, LinkResponse } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import QRCode from "qrcode";

const AdminPage = () => {
  const { toast } = useToast();
  
  // Game eggs state
  const [editingEgg, setEditingEgg] = useState<number | null>(null);
  const [eggReward, setEggReward] = useState<number>(0);
  
  // Custom link state
  const [domain, setDomain] = useState<string>("dammedaga.fun");
  const [subdomain, setSubdomain] = useState<string>("");
  const [path, setPath] = useState<string>("");
  
  // QR code dialog state
  const [showQRCode, setShowQRCode] = useState<boolean>(false);
  const [qrCodeURL, setQrCodeURL] = useState<string>("");
  const [qrCodeData, setQrCodeData] = useState<string>("");
  
  // Republish state
  const [republishLink, setRepublishLink] = useState<LinkResponse | null>(null);
  
  // Fetch all eggs
  const { data: eggs = [], isLoading: eggsLoading } = useQuery({
    queryKey: ["/api/admin/eggs"],
  });
  
  // Fetch all custom links
  const { data: links = [], isLoading: linksLoading } = useQuery({
    queryKey: ["/api/admin/links"],
  });
  
  // Update egg reward mutation
  const { mutate: updateEggReward } = useMutation({
    mutationFn: async (data: UpdateEggRequest) => {
      const response = await apiRequest("POST", "/api/admin/update-egg", data);
      return response.json();
    },
    onSuccess: () => {
      // Show success message
      toast({
        title: "Cập nhật thành công",
        description: "Phần thưởng đã được cập nhật.",
      });
      
      // Reset state
      setEditingEgg(null);
      setEggReward(0);
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["/api/admin/eggs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/game-state"] });
    },
    onError: (error) => {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật phần thưởng. Hãy thử lại.",
        variant: "destructive",
      });
    },
  });
  
  // Create custom link mutation
  const { mutate: createCustomLink } = useMutation({
    mutationFn: async (data: CreateLinkRequest) => {
      const response = await apiRequest("POST", "/api/admin/create-link", data);
      return response.json();
    },
    onSuccess: () => {
      // Show success message
      toast({
        title: "Tạo link thành công",
        description: "Link mới đã được tạo.",
      });
      
      // Reset form
      setSubdomain("");
      setPath("");
      
      // Invalidate query
      queryClient.invalidateQueries({ queryKey: ["/api/admin/links"] });
    },
    onError: (error) => {
      toast({
        title: "Lỗi",
        description: "Không thể tạo link. Hãy thử lại.",
        variant: "destructive",
      });
    },
  });
  
  // Delete custom link mutation
  const { mutate: deleteCustomLink } = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/admin/links/${id}`);
      return response.json();
    },
    onSuccess: () => {
      // Show success message
      toast({
        title: "Xóa link thành công",
        description: "Link đã được xóa.",
      });
      
      // Invalidate query
      queryClient.invalidateQueries({ queryKey: ["/api/admin/links"] });
    },
    onError: (error) => {
      toast({
        title: "Lỗi",
        description: "Không thể xóa link. Hãy thử lại.",
        variant: "destructive",
      });
    },
  });
  
  // Handle edit egg
  const handleEditEgg = (eggId: number, currentReward: number) => {
    setEditingEgg(eggId);
    setEggReward(currentReward);
  };
  
  // Handle save egg reward
  const handleSaveEggReward = () => {
    if (editingEgg === null) return;
    
    updateEggReward({
      eggId: editingEgg,
      reward: eggReward,
    });
  };
  
  // Handle create custom link
  const handleCreateLink = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subdomain) {
      toast({
        title: "Không hợp lệ",
        description: "Bạn phải nhập tên miền phụ.",
        variant: "destructive",
      });
      return;
    }
    
    createCustomLink({
      domain,
      subdomain,
      path,
    });
  };
  
  // Handle delete link
  const handleDeleteLink = (id: number) => {
    if (confirm("Bạn có chắc muốn xóa link này không?")) {
      deleteCustomLink(id);
    }
  };
  
  // Format reward as string
  const formatReward = (reward: number) => {
    return reward.toFixed(2);
  };
  
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Trang quản trị</h1>
        <a 
          href="/" 
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
        >
          Quay lại trang chính
        </a>
      </div>
      
      <Tabs defaultValue="eggs">
        <TabsList className="mb-4">
          <TabsTrigger value="eggs">Cài đặt phần thưởng</TabsTrigger>
          <TabsTrigger value="links">Quản lý links</TabsTrigger>
        </TabsList>
        
        {/* Eggs tab */}
        <TabsContent value="eggs">
          <Card>
            <CardHeader>
              <CardTitle>Cài đặt phần thưởng cho các trứng vàng</CardTitle>
              <CardDescription>
                Điều chỉnh giá trị phần thưởng cho từng quả trứng
              </CardDescription>
            </CardHeader>
            <CardContent>
              {eggsLoading ? (
                <div className="flex justify-center py-4">Đang tải...</div>
              ) : (
                <Table>
                  <TableCaption>Danh sách các quả trứng và phần thưởng</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Quả trứng</TableHead>
                      <TableHead>Giá trị phần thưởng</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead className="text-right">Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.isArray(eggs) && eggs.map((egg: any) => (
                      <TableRow key={egg.id}>
                        <TableCell>Trứng #{egg.id}</TableCell>
                        <TableCell>
                          {editingEgg === egg.id ? (
                            <Input
                              type="number"
                              value={eggReward}
                              onChange={(e) => setEggReward(Number(e.target.value))}
                              className="w-32"
                            />
                          ) : (
                            formatReward(egg.reward)
                          )}
                        </TableCell>
                        <TableCell>{egg.broken ? "Đã vỡ" : "Còn nguyên"}</TableCell>
                        <TableCell className="text-right">
                          {editingEgg === egg.id ? (
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="default" 
                                size="sm"
                                onClick={handleSaveEggReward}
                              >
                                Lưu
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setEditingEgg(null)}
                              >
                                Hủy
                              </Button>
                            </div>
                          ) : (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEditEgg(egg.id, egg.reward)}
                            >
                              Sửa
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Links tab */}
        <TabsContent value="links">
          <div className="grid gap-6">
            {/* Create link form */}
            <Card>
              <CardHeader>
                <CardTitle>Xuất bản Landing Page</CardTitle>
                <CardDescription>
                  Tên miền riêng
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateLink} className="space-y-4">
                  <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="subdomain">Tên miền phụ</Label>
                        <Input
                          id="subdomain"
                          placeholder="ten-mien-phu"
                          value={subdomain}
                          onChange={(e) => setSubdomain(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="domain">Tên miền chính</Label>
                        <Input
                          id="domain"
                          value={domain}
                          onChange={(e) => setDomain(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="path">Đường dẫn (không bắt buộc)</Label>
                        <Input
                          id="path"
                          placeholder="/duong-dan"
                          value={path}
                          onChange={(e) => setPath(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-500">
                        Preview: https://{subdomain}.{domain}{path}
                      </div>
                      <div>
                        <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">Xuất bản</Button>
                      </div>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>
            
            {/* Links list with success notification */}
            <Card>
              <CardHeader>
                <CardTitle>Danh sách links</CardTitle>
                <CardDescription>
                  Quản lý các link đã tạo
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Success message when link created */}
                {Array.isArray(links) && links.length > 0 && (
                  <div className="mb-6 border border-green-200 bg-green-50 rounded-md p-4">
                    <div className="flex items-center mb-2">
                      <div className="mr-2 flex-shrink-0 h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                        <svg className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-green-800">Mừng quá, xuất bản thành công rồi!</h3>
                    </div>
                    
                    <div className="mt-3 bg-white p-3 rounded-md border border-gray-200">
                      <div className="text-sm font-medium text-gray-600 mb-1">Trang của bạn</div>
                      <div className="flex items-center justify-between">
                        <a 
                          href={links[links.length-1].fullUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm"
                        >
                          {links[links.length-1].fullUrl}
                        </a>
                        <div className="flex space-x-2">
                          <button 
                            className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded-md" 
                            onClick={() => {
                              navigator.clipboard.writeText(links[links.length-1].fullUrl);
                              toast({
                                title: "Đã sao chép!",
                                description: "Link đã được sao chép vào clipboard",
                              });
                            }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                          </button>
                          <button 
                            className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded-md"
                            onClick={() => {
                              setQrCodeURL(links[links.length-1].fullUrl);
                              
                              // Generate QR code
                              QRCode.toDataURL(links[links.length-1].fullUrl, { width: 300 })
                                .then((url) => {
                                  setQrCodeData(url);
                                  setShowQRCode(true);
                                })
                                .catch((err) => {
                                  console.error(err);
                                  toast({
                                    title: "Lỗi!",
                                    description: "Không thể tạo mã QR code",
                                    variant: "destructive",
                                  });
                                });
                            }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                          </button>
                          <button 
                            className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded-md"
                            onClick={() => {
                              window.open(links[links.length-1].fullUrl, '_blank');
                            }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 text-center">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="bg-indigo-600 text-white border-0 hover:bg-indigo-700"
                        onClick={() => {
                          // Set values from the last link
                          setSubdomain(links[links.length-1].subdomain);
                          setDomain(links[links.length-1].domain);
                          setPath(links[links.length-1].path);
                          
                          // Republish link using handleCreateLink
                          toast({
                            title: "Đang xuất bản lại...",
                            description: "Đang tạo lại trang web của bạn"
                          });
                        }}
                      >
                        Xuất bản lại
                      </Button>
                    </div>
                  </div>
                )}
              
                {linksLoading ? (
                  <div className="flex justify-center py-4">Đang tải...</div>
                ) : (
                  <Table>
                    <TableCaption>Danh sách các link tùy chỉnh</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Link đầy đủ</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead>Ngày tạo</TableHead>
                        <TableHead className="text-right">Hành động</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Array.isArray(links) && links.map((link: LinkResponse) => (
                        <TableRow key={link.id}>
                          <TableCell className="font-medium">
                            <a 
                              href={link.fullUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              {link.fullUrl}
                            </a>
                          </TableCell>
                          <TableCell>
                            {link.active ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Hoạt động
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Không hoạt động
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {new Date(link.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => handleDeleteLink(link.id)}
                            >
                              Xóa
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      
                      {(!Array.isArray(links) || links.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8">
                            Chưa có link nào được tạo
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPage;
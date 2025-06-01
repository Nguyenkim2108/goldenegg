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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import QRCode from "qrcode";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";

// QR Code dialog component
const QRCodeDialog = ({ 
  open, 
  onOpenChange, 
  qrCodeData, 
  qrCodeURL 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  qrCodeData: string; 
  qrCodeURL: string;
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Mã QR Code</DialogTitle>
      </DialogHeader>
      <div className="flex flex-col items-center justify-center py-4">
        {qrCodeData && (
          <>
            <img src={qrCodeData} alt="QR Code" className="mb-4 border p-2 rounded-md" />
            <p className="text-center text-sm text-gray-500">{qrCodeURL}</p>
            <div className="flex space-x-2 mt-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  // Download QR code image
                  const link = document.createElement('a');
                  link.href = qrCodeData;
                  link.download = 'qrcode.png';
                  link.click();
                }}
              >
                Tải xuống
              </Button>
              <Button 
                size="sm" 
                onClick={() => onOpenChange(false)}
              >
                Đóng
              </Button>
            </div>
          </>
        )}
      </div>
    </DialogContent>
  </Dialog>
);

interface EggData {
  id: number;
  reward: number;
  broken: boolean;
  winningRate: number;
}

const AdminPage = () => {
  const { toast } = useToast();
  
  // Game eggs state
  const [editingEgg, setEditingEgg] = useState<number | null>(null);
  const [eggReward, setEggReward] = useState<string>("0"); // Thay đổi thành string
  const [eggWinningRate, setEggWinningRate] = useState<number>(100);
  
  // Custom link state
  const [protocol, setProtocol] = useState<string>("https");
  const [domain, setDomain] = useState<string>("");
  const [subdomain, setSubdomain] = useState<string>("");
  const [path, setPath] = useState<string>("");
  
  // QR code dialog state
  const [showQRCode, setShowQRCode] = useState<boolean>(false);
  const [qrCodeURL, setQrCodeURL] = useState<string>("");
  const [qrCodeData, setQrCodeData] = useState<string>("");
  
  // Republish state
  const [republishLink, setRepublishLink] = useState<LinkResponse | null>(null);
  
  // Fetch all eggs
  const { data: eggs = [], isLoading: eggsLoading } = useQuery<EggData[]>({
    queryKey: ["/api/admin/eggs"],
  });
  
  // Fetch all custom links
  const { data: links = [], isLoading: linksLoading } = useQuery<LinkResponse[]>({
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
        description: "Phần thưởng và tỉ lệ trúng thưởng đã được cập nhật.",
      });
      
      // Reset state
      setEditingEgg(null);
      setEggReward("0");
      setEggWinningRate(100);
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["/api/admin/eggs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/game-state"] });
    },
    onError: (error) => {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật thông tin quả trứng. Hãy thử lại.",
        variant: "destructive",
      });
    },
  });
  
  // Set egg broken state mutation
  const { mutate: setEggBrokenState } = useMutation({
    mutationFn: async (data: { eggId: number; broken: boolean }) => {
      const response = await apiRequest("POST", "/api/admin/set-egg-broken", data);
      return response.json();
    },
    onSuccess: (data) => {
      // Show success message
      toast({
        title: "Cập nhật thành công",
        description: `Quả trứng #${data.id} đã ${data.broken ? 'được đánh dấu vỡ' : 'được đánh dấu chưa vỡ'}.`,
      });
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["/api/admin/eggs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/game-state"] });
    },
    onError: (error) => {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật trạng thái quả trứng. Hãy thử lại.",
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
    onSuccess: (data: LinkResponse) => {
      // Show success message
      toast({
        title: "Tạo link thành công",
        description: "Link mới đã được tạo.",
      });
      
      // Generate QR code for the new link
      let fullSubdomain = subdomain ? `${subdomain}.` : "";
      const fullUrl = `${protocol}://${fullSubdomain}${data.domain}${data.path || ''}?linkId=${data.id}`;
      
      QRCode.toDataURL(fullUrl, { margin: 2 }, (err, url) => {
        if (err) {
          console.error('Error generating QR code:', err);
          return;
        }
        
        // Open QR code dialog
        setQrCodeData(url);
        setQrCodeURL(fullUrl);
        setShowQRCode(true);
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
  const handleEditEgg = (egg: EggData) => {
    setEditingEgg(egg.id);
    setEggReward(String(egg.reward)); // Convert to string
    setEggWinningRate(egg.winningRate);
  };
  
  // Handle save egg reward
  const handleSaveEggReward = () => {
    if (editingEgg === null) return;
    
    updateEggReward({
      eggId: editingEgg,
      reward: eggReward,
      winningRate: eggWinningRate
    });
  };
  
  // Handle create custom link
  const handleCreateLink = (e: React.FormEvent) => {
    e.preventDefault();
    
    createCustomLink({
      domain,
      subdomain: subdomain || "",
      path,
      eggId: 0, // Không chỉ định quả trứng cụ thể
      protocol // Gửi protocol đã chọn
    });
  };
  
  // Handle delete link
  const handleDeleteLink = (id: number) => {
    if (confirm("Bạn có chắc muốn xóa link này không?")) {
      deleteCustomLink(id);
    }
  };
  
  // Format reward as string
  const formatReward = (reward: number | string) => {
    if (typeof reward === 'string') {
      return reward;
    }
    return reward.toFixed(2);
  };
  
  // Generate custom link options
  const generateLinkOption = (link: LinkResponse) => {
    let fullSubdomain = link.subdomain ? `${link.subdomain}.` : "";
    return `${link.protocol || 'https'}://${fullSubdomain}${link.domain}${link.path || ''}?linkId=${link.id}`;
  };
  
  // Hiển thị preview URL
  const previewUrl = () => {
    let fullSubdomain = subdomain ? `${subdomain}.` : "";
    return `${protocol}://${fullSubdomain}${domain}${path || ''}`;
  };
  
  // Generate QR code for an existing link
  const generateQRCode = (link: LinkResponse) => {
    let fullSubdomain = link.subdomain ? `${link.subdomain}.` : "";
    const fullUrl = `${link.protocol || 'https'}://${fullSubdomain}${link.domain}${link.path || ''}?linkId=${link.id}`;
    
    QRCode.toDataURL(fullUrl, { margin: 2 }, (err, url) => {
      if (err) {
        console.error('Error generating QR code:', err);
        return;
      }
      
      // Open QR code dialog
      setQrCodeData(url);
      setQrCodeURL(fullUrl);
      setShowQRCode(true);
    });
  };
  
  // Handle toggle egg broken state
  const handleToggleEggBrokenState = (egg: EggData) => {
    if (confirm(`Bạn có chắc muốn ${egg.broken ? 'khôi phục' : 'đánh dấu vỡ'} quả trứng #${egg.id} không?`)) {
      setEggBrokenState({
        eggId: egg.id,
        broken: !egg.broken
      });
    }
  };
  
  return (
    <div className="container mx-auto py-8">
      {/* QR Code Dialog */}
      <QRCodeDialog 
        open={showQRCode} 
        onOpenChange={setShowQRCode} 
        qrCodeData={qrCodeData} 
        qrCodeURL={qrCodeURL}
      />

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
          <TabsTrigger value="links">Quản lý link</TabsTrigger>
        </TabsList>
        
        {/* Eggs tab content */}
        <TabsContent value="eggs">
          <Card>
            <CardHeader>
              <CardTitle>Các quả trứng vàng</CardTitle>
              <CardDescription>
                Điều chỉnh phần thưởng và tỉ lệ trúng thưởng cho từng quả trứng vàng.
              </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                <TableCaption>Danh sách quả trứng vàng</TableCaption>
                  <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">ID</TableHead>
                    <TableHead className="w-[120px]">Phần thưởng</TableHead>
                    <TableHead>Tỉ lệ trúng thưởng</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {eggsLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">Đang tải...</TableCell>
                    </TableRow>
                  ) : (
                    eggs.map((egg) => (
                      <TableRow key={egg.id}>
                        <TableCell className="font-medium">Trứng #{egg.id}</TableCell>
                        <TableCell>
                          {editingEgg === egg.id ? (
                            <Input
                              type="text"
                              value={eggReward}
                              onChange={(e) => setEggReward(e.target.value)}
                              className="w-32"
                              placeholder="Nhập phần thưởng"
                            />
                          ) : (
                            formatReward(egg.reward)
                          )}
                        </TableCell>
                        <TableCell>
                          {editingEgg === egg.id ? (
                            <div className="flex items-center space-x-2">
                              <Slider
                                min={0}
                                max={100}
                                step={1}
                                value={[eggWinningRate]}
                                onValueChange={(values) => setEggWinningRate(values[0])}
                                className="w-32"
                              />
                              <Input
                                type="number"
                                min={0}
                                max={100}
                                value={eggWinningRate}
                                onChange={(e) => setEggWinningRate(Number(e.target.value))}
                                className="w-16"
                              />
                              <span>%</span>
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                                <div 
                                  className={`h-2.5 rounded-full ${
                                    egg.winningRate > 80 ? 'bg-green-500' : 
                                    egg.winningRate > 40 ? 'bg-yellow-500' : 
                                    'bg-red-500'
                                  }`}
                                  style={{ width: `${egg.winningRate}%` }}
                                ></div>
                              </div>
                              <span className="text-sm">{egg.winningRate}%</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 text-xs rounded-full ${egg.broken ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                            {egg.broken ? 'Đã vỡ' : 'Chưa vỡ'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {editingEgg === egg.id ? (
                            <div className="flex justify-end space-x-2">
                              <Button 
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
                            <div className="flex justify-end space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleEditEgg(egg)}
                              >
                                Sửa
                              </Button>
                              <Button 
                                variant={egg.broken ? "destructive" : "default"}
                                size="sm"
                                onClick={() => handleToggleEggBrokenState(egg)}
                              >
                                {egg.broken ? 'Khôi phục' : 'Đánh dấu vỡ'}
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                  </TableBody>
                </Table>
              
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Links tab content */}
        <TabsContent value="links">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Create link form */}
            <Card>
              <CardHeader>
                <CardTitle>Tạo link mới</CardTitle>
                <CardDescription>
                  Tạo link truy cập cho người dùng.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateLink} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Giao thức</Label>
                    <RadioGroup 
                      defaultValue="https" 
                      value={protocol}
                      onValueChange={setProtocol}
                      className="flex space-x-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="http" id="http" />
                        <Label htmlFor="http">HTTP</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="https" id="https" />
                        <Label htmlFor="https">HTTPS</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                      <div className="space-y-2">
                    <Label htmlFor="subdomain">Tên miền phụ (không bắt buộc)</Label>
                        <Input
                          id="subdomain"
                          value={subdomain}
                          onChange={(e) => setSubdomain(e.target.value)}
                      placeholder="vd: player123"
                        />
                      </div>
                  
                      <div className="space-y-2">
                    <Label htmlFor="domain">Tên miền</Label>
                        <Input
                          id="domain"
                          value={domain}
                          onChange={(e) => setDomain(e.target.value)}
                      required
                        />
                      </div>
                  
                      <div className="space-y-2">
                        <Label htmlFor="path">Đường dẫn (không bắt buộc)</Label>
                        <Input
                          id="path"
                          value={path}
                          onChange={(e) => setPath(e.target.value)}
                      placeholder="vd: /game"
                        />
                      </div>
                  
                  <div className="p-2 border rounded-md bg-gray-50">
                    <p className="text-sm text-gray-700">Preview: {previewUrl()}</p>
                    </div>

                  
                  
                  <Button type="submit" className="w-full">
                    Tạo link
                  </Button>
                </form>
              </CardContent>
            </Card>
            
            {/* Links list */}
            <Card>
              <CardHeader>
                <CardTitle>Danh sách link</CardTitle>
                <CardDescription>
                  Quản lý các link đã tạo.
                </CardDescription>
              </CardHeader>
              <CardContent className="max-h-[400px] overflow-y-auto">
                  <Table>
                  <TableCaption>Danh sách link</TableCaption>
                    <TableHeader>
                    <TableRow>
                      <TableHead>URL</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {linksLoading ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center">Đang tải...</TableCell>
                      </TableRow>
                    ) : links.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center">Chưa có link nào.</TableCell>
                      </TableRow>
                    ) : (
                      links.map((link) => (
                        <TableRow key={link.id}>
                          <TableCell>
                            <div className="text-xs truncate max-w-[120px]">
                            <a 
                                href={generateLinkOption(link)}
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                                title={generateLinkOption(link)}
                            >
                                {link.subdomain ? link.subdomain : link.domain}
                            </a>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 text-xs rounded-full ${link.used ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                              {link.used ? 'Đã dùng' : 'Chưa dùng'}
                              </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                                onClick={() => generateQRCode(link)}
                                title="Tạo QR Code"
                              >
                                QR
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                  // Copy link to clipboard
                                  navigator.clipboard.writeText(generateLinkOption(link));
                                    toast({
                                    title: "Đã sao chép",
                                    description: "Link đã được sao chép vào clipboard.",
                                  });
                              }}
                                title="Sao chép link"
                            >
                                URL
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => handleDeleteLink(link.id)}
                                title="Xóa link"
                            >
                              Xóa
                            </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                      )}
                    </TableBody>
                  </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPage;
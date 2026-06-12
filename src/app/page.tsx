"use client"

// 1. Core Component Imports (Updated from @workspace to clear errors)
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

// 2. Icon and React Imports (Keep these exactly as they are)
import { AlertTriangle, Bot, Camera, Globe, Image, ImageIcon, Loader2, Map, MapPin, Shield, TrendingUp, Upload } from "lucide-react"
import { useRef, useState, useEffect } from "react"


interface FloodRiskData{
  riskLevel: "low" | "medium" | "high" | "very high";
  description: string
  recommendations: string[];
  elevation: number;
  distanceFromWater: number;
}

export default function Page() {
  const [imagePreview, setImagePreview] = useState<string>("")
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showAlert, setShowAlert] = useState<boolean>(false)
  const [alertMessage, setAlertMessage] = useState<string>("")
  const [floodRisk, setFloodRisk] = useState<FloodRiskData | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false)
  const[analysisType, setAnalysisType] = useState<'coordinates' | 'image' >('coordinates')
  const [aiAnalysis, setAiAnalysis] = useState<string>("")
  const [map, setMap] = useState<boolean>(false)
  const [mapError, setMapError] = useState<boolean>(true)
  const mapRef = useRef<HTMLDivElement>(null)

  const API_BASE_URL = "https://flood-detection-ai-backend.onrender.com"

  const callAPI = async(endpoint: string, data: any)=> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method:"POST", 
      headers: endpoint.includes("coordinates") ? {"Content-Type":"application/json"} : {},
      body: endpoint.includes("coordinates") ? JSON.stringify(data) : data,
    })

    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`)
    }
    return response.json()
  }

  const getRiskVariant = (riskLevel: string) => {
    switch (riskLevel) {
      case "very high":
        return "destructive"
      case "high":
        return "destructive"
      case "medium":
        return "secondary"
      case "low":
        return "default"
      default:
        return "default"
    }
  }

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case "very high":
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      case "high":
        return <AlertTriangle className="h-4 w-4 text-orange-600" />
      case "medium":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case "low":
        return <Shield className="h-4 w-4 text-green-600" />
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />
    }
  }

  const handleImageUploaded = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if(file){
      if(file.size > 10 * 1024 * 1024 || !file.type.startsWith("image/")) {
        setAlertMessage(file.size > 10 * 1024 * 1024 ? "Image size must be less than 10MB" : "Please Select a valid image file")
        setShowAlert(true)
        return;
      }
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onload = (e) => setImagePreview(e.target?.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleImageAnalysis = async()=> {
    if (!selectedImage){
      setAlertMessage("Please select an image to analyze")
      setShowAlert(true)
      return;
    }
    
    setIsLoading(true)

    try{
      const formData = new FormData()
      formData.append("file", selectedImage)

      const apiResponse = await callAPI("/api/analyze/image", formData)

      const riskData:FloodRiskData = {
        riskLevel: apiResponse.risk_level,
        description: apiResponse.description,
        recommendations: apiResponse.recommendations,
        elevation: apiResponse.elevation,
        distanceFromWater: apiResponse.distance_from_water,
      }

      setFloodRisk(riskData)
      setAiAnalysis(apiResponse.ai_analysis || "")

    }catch(error){
      console.error("Error analyzing image:", error)
      setAlertMessage("Failed to analyze image. Please try again.")
      setShowAlert(true)
    }finally {
      setIsLoading(false)
    }
    
  }

  return (
    <div className="min-h-screen flex bg-white-950">
      <div className="container mx-auto px-4 py-8 max-w-6xl">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-blue-600 rounded-full shadow-lg shadow-blue-600/50">
              <Globe className="h-8 w-8 text-white" />
            </div>
          </div>

          <h1 className="text-4xl font-bold text-black mt-6">Flood Detection System</h1>
          <p className="text-black mt-2">Intelligent flood prediction and risk assessment</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Input */}
          <Card className="shadow-lg shadow-white/10 ">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600"/>
                Analysis Parameters
                
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue={"coordinates"} className="w-full">
                <TabsList className="w-full">
                  <TabsTrigger value={"coordinates"} className="flex items-center justify-center gap-2 w-full"><MapPin className="mr-2 h-4 w-4" />Coordinates</TabsTrigger>
                  <TabsTrigger value={"image_analysis"} className="flex items-center justify-center gap-2 w-full"><Bot className="mr-2 h-4 w-4" />Image Analysis</TabsTrigger>
                </TabsList>

                <TabsContent value={"coordinates"} className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="latitude" className="text-black">Latitude</Label>
                      <Input id="latitude" type="number" placeholder="Enter latitude" className="text-black" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="longitude" className="text-black">Longitude</Label>
                      <Input id="longitude" type="number" placeholder="Enter longitude" className="text-black" />
                    </div>
                  </div>
                  <Button className="w-full bg-black hover:bg-black/80 mt-4"><MapPin className=" h-4 w-4" />Analyze</Button>
                </TabsContent>
                <TabsContent value={"image_analysis"} className="space-y-4 mt-4">
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
                      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUploaded} className="hidden" /> 
                      {!imagePreview ? (
                        <div className="space-y-4">
                          <Upload className="h-12 w-12 mx-auto text-slate-400" />
                          <p className="text-sm font-medium text-slate-700">Upload terrain image</p>
                          <p className="text-xs text-slate-500 mt-1">JPG, PNG, or GIF up to 10MB</p>
                          <Button onClick={() => fileInputRef.current?.click()} variant="outline" size="sm"><Camera className="mr-2 h-4 w-4" />Choose Image</Button>
                        </div>

                      ): (
                      <div className="space-y-4">
                        <img src={imagePreview} alt="preview" className="max-h-48 mx-auto rounded-lg shadow-sm" />

                      </div>
                    )}
                    </div>
                    <Button
                      onClick={handleImageAnalysis}
                      disabled={isLoading || !selectedImage}
                      className="w-full"
                      size="lg"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Image className="mr-2 h-4 w-4" />
                          Analyze Image
                        </>
                      )}
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="flex item-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    Risk Assessment
              </CardHeader>
              <CardContent > 
                    {isLoading && (
                      <div className="flex flex-col items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
                        <p className="text-slate-600">{analysisType === 'coordinates' ? 'Analyzing coordinates...':'Analyzing image...'}</p>
                      </div>
                    )}

                    {floodRisk && !isLoading && (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getRiskIcon(floodRisk.riskLevel)}
                            <span className="font-semibold">Risk Level</span>
                          </div>
                          <Badge variant={getRiskVariant(floodRisk.riskLevel)} className="text-sm">
                            {floodRisk.riskLevel}
                          </Badge>

                        </div>
                        <p className="text-slate-600 text-sm leading-relaxed">{floodRisk.description}</p>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-slate-50 rounded-lg">
                            <div className="text-2xl font-bold text-blue-600">
                              {floodRisk.elevation}m
                            </div>
                            <div className="text-xs text-slate-500">Elevation</div>
                          </div>
                          <div className="p-4 bg-slate-50 rounded-lg">
                            <div className="text-2xl font-bold text-blue-600">
                              {floodRisk.distanceFromWater}m
                            </div>
                            <div className="text-xs text-slate-500">From Water</div>
                          </div>
                        </div>

                        {aiAnalysis && (
                          <>
                            <Separator />
                            <div>
                              <h4 className="font-medium text-slate-700 mb-3">
                                AI Analysis
                              </h4>
                              <div className="p-3 bg-slate-50 rounded-lg">
                                <p className="text-sm text-slate-600 whitespace-pre-wrap">
                                  {aiAnalysis}
                                </p>
                              </div>
                            </div>
                          </>
                        )}

                        <div>
                          <h4 className="font-medium text-slate-700 mb-3">
                            Recommendations
                          </h4>
                          <ul className="space-y-2">
                            {floodRisk.recommendations.map((rec, index) => (
                              <li
                                key={index}
                                className="flex items-start gap-2 text-sm text-slate-600"
                              >
                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}

                    {!floodRisk && !isLoading && (
                      <div className="text-center py-12 text-slate-500">
                        <Shield className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                        <p>Choose an analysis method to see flood risk assessment</p>
                      </div>
                    )}

              </CardContent>
          </Card>
        </div>
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-green-600" />
              Interactive Map
            </CardTitle>
          </CardHeader>
          <CardContent>
            {mapError ? (
              <div className="w-full h-80 rounded-lg border border-slate-200 bg-slate-50 flex flex-col items-center justify-center">
                <Map className="h-16 w-16 text-slate-300 mb-4" />
                <h3 className="text-lg font-semibold text-slate-700 mb-2">
                  Map Not Available
                </h3>
                <p className="text-slate-500 text-center max-w-md">
                  To enable the interactive map, set up a Google Maps API key in
                  .env.local
                </p>
              </div>
            ) : (
              <div
                ref={mapRef}
                className="w-full h-80 rounded-lg border border-slate-200"
              />
            )}
          </CardContent>
        </Card>


      </div>

      <AlertDialog open={showAlert} onOpenChange={setShowAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Input Error</AlertDialogTitle>
            <AlertDialogDescription>
              {alertMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  )
}

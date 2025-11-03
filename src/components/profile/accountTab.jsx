/* eslint-disable react/prop-types */
"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import SellerAccountStatus from "@/components/profile/sellerAccountStatus";
import IDVerificationCard from "@/components/profile/idVerificationCard";
import PremiumAccountSubscription from "@/components/profile/premiumAccountSubscription";
import ManualAddressForm from "@/components/profile/manualAddressForm";
import GoogleLocationSearch from "@/components/googleLocationSearch";
import { toast } from "sonner";

export default function AccountTab({
  authUser,
  profileDoc,
  personalInfo,
  setPersonalInfo,
  handleSaveChanges,
  editingAddress,
  setEditingAddress,
  formattedAddress,
  showEnterAddressManually,
  setShowEnterAddressManually,
  handleSaveAddress,
  setShowDeleteModal,
}) {
  return (
    <TabsContent value="account" className="space-y-6">
      <h2 className="text-2xl font-bold">Account Settings</h2>

      {/* Seller Account */}
      {profileDoc?.isPremium ? (
        <SellerAccountStatus profileDoc={profileDoc} />
      ) : null}

      <PremiumAccountSubscription />

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Personal Information</CardTitle>
          <CardDescription>Update your personal details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              defaultValue={authUser?.displayName || profileDoc?.username || ""}
              disabled={true}
              placeholder="Your username"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" defaultValue={authUser?.email} disabled />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={personalInfo.phoneNumber || ""}
              onChange={(e) =>
                setPersonalInfo({
                  ...personalInfo,
                  phoneNumber: e.target.value,
                })
              }
              placeholder="Your phone number"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={personalInfo.bio || ""}
              onChange={(e) =>
                setPersonalInfo({
                  ...personalInfo,
                  bio: e.target.value,
                })
              }
              placeholder="Add some info about yourself..."
              rows={4}
            />
          </div>

          <Button
            className="mt-2 hover:cursor-pointer hover:bg-primary/80"
            onClick={handleSaveChanges}
          >
            Save Changes
          </Button>
        </CardContent>
      </Card>

      {/* Show ID verification if user is premium */}
      {profileDoc?.isPremium ? <IDVerificationCard /> : null}

      {/* Address Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Address Information</CardTitle>
          <CardDescription>
            Update your address information to be used for shipping your
            fragrances
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="formattedAddress">Address</Label>
            {!editingAddress ? (
              <div className="flex items-center gap-2">
                <Input
                  id="formattedAddress"
                  value={formattedAddress}
                  disabled
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingAddress(true)}
                >
                  Change
                </Button>
              </div>
            ) : showEnterAddressManually ? (
              <ManualAddressForm
                onSave={(data) => {
                  handleSaveAddress(data);
                }}
                onCancel={() => setShowEnterAddressManually(false)}
              />
            ) : (
              <div>
                <GoogleLocationSearch
                  defaultValue={formattedAddress}
                  onSelect={(locationData) => {
                    handleSaveAddress(locationData);
                  }}
                />
                <div className="flex items-center mt-4 gap-2">
                  <Button
                    variant="destructive"
                    className="hover:cursor-pointer hover:bg-destructive/80"
                    onClick={() => setEditingAddress(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="hover:cursor-pointer hover:bg-primary/80"
                    onClick={() => setShowEnterAddressManually(true)}
                  >
                    Enter address manually
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Password */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Password</CardTitle>
          <CardDescription>Change your password</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">Current Password</Label>
            <Input
              id="current-password"
              type="password"
              placeholder="••••••••"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <Input id="new-password" type="password" placeholder="••••••••" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <Input
              id="confirm-password"
              type="password"
              placeholder="••••••••"
            />
          </div>

          <Button
            className="mt-2 hover:cursor-pointer hover:bg-primary/80 shadow-md"
            onClick={() => toast.success("Password update coming soon!")}
          >
            Update Password
          </Button>
        </CardContent>
      </Card>

      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-lg text-destructive">
            Danger Zone
          </CardTitle>
          <CardDescription>
            Actions to delete or deactivate your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-dashed border-destructive/50 p-4">
            <h4 className="font-semibold text-destructive">Delete Account</h4>
            <p className="mt-1 text-sm text-muted-foreground">
              This will permanently delete your account and all associated data.
            </p>
            <Button
              variant="destructive"
              className="mt-4 hover:cursor-pointer hover:bg-destructive/80"
              onClick={() => setShowDeleteModal(true)}
            >
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}

from rest_framework import serializers
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User, DoctorProfile, PatientProfile


# ────────────────────────────────────────────
#  Registration
# ────────────────────────────────────────────

class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    password2 = serializers.CharField(write_only=True, min_length=8)
    first_name = serializers.CharField(max_length=30)
    last_name = serializers.CharField(max_length=30)
    role = serializers.ChoiceField(choices=User.ROLE_CHOICES)

    # Doctor-only optional fields
    specialty = serializers.CharField(max_length=120, required=False, default="")
    license_number = serializers.CharField(max_length=60, required=False, default="")

    # Patient-only optional fields
    date_of_birth = serializers.DateField(required=False, allow_null=True, default=None)
    phone_number = serializers.CharField(max_length=20, required=False, default="")

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value.lower()

    def validate(self, data):
        if data["password"] != data["password2"]:
            raise serializers.ValidationError({"password2": "Passwords do not match."})
        return data

    def create(self, validated_data):
        # Pop profile fields
        specialty = validated_data.pop("specialty", "")
        license_number = validated_data.pop("license_number", "")
        date_of_birth = validated_data.pop("date_of_birth", None)
        phone_number = validated_data.pop("phone_number", "")
        validated_data.pop("password2")

        user = User.objects.create_user(
            email=validated_data["email"],
            password=validated_data["password"],
            first_name=validated_data["first_name"],
            last_name=validated_data["last_name"],
            role=validated_data["role"],
        )

        # Create the matching profile
        if user.role == "doctor":
            DoctorProfile.objects.create(
                user=user,
                specialty=specialty,
                license_number=license_number,
            )
        else:
            PatientProfile.objects.create(
                user=user,
                date_of_birth=date_of_birth,
                phone_number=phone_number,
            )

        return user


# ────────────────────────────────────────────
#  Login
# ────────────────────────────────────────────

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        user = authenticate(email=data["email"].lower(), password=data["password"])
        if not user:
            raise serializers.ValidationError("Invalid email or password.")
        if not user.is_active:
            raise serializers.ValidationError("This account is deactivated.")
        data["user"] = user
        return data


# ────────────────────────────────────────────
#  Profile read
# ────────────────────────────────────────────

class DoctorProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = DoctorProfile
        fields = ("specialty", "license_number")


class PatientProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = PatientProfile
        fields = ("date_of_birth", "phone_number")


class UserSerializer(serializers.ModelSerializer):
    profile = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ("id", "email", "first_name", "last_name", "role", "profile")

    def get_profile(self, obj):
        if obj.role == "doctor" and hasattr(obj, "doctor_profile"):
            return DoctorProfileSerializer(obj.doctor_profile).data
        if obj.role == "patient" and hasattr(obj, "patient_profile"):
            return PatientProfileSerializer(obj.patient_profile).data
        return {}

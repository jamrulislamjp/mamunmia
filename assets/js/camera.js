// CAMERA START
// Camera / crop / upload feature. Its markup lives in components/camera.html,
// which is fetched into #cameraMount before the handlers are attached.

function initCamera() {
  let stream = null;
  let track = null;
  let cropper = null;

  // DSLR Camera Logic
  document
    .getElementById("cameraButton")
    .addEventListener("click", async function () {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment",
            width: { ideal: 3840 },
            height: { ideal: 2160 },
          },
        });

        const video = document.getElementById("cameraStream");
        video.srcObject = stream;
        track = stream.getVideoTracks()[0];

        $("#cameraContainer").show();
        $("#imageContainer").hide();

        // Setup Advanced Controls
        const caps = track.getCapabilities();

        if (caps.zoom) {
          $("#zoomSlider").attr({
            min: caps.zoom.min,
            max: caps.zoom.max,
            step: caps.zoom.step,
          });
          $("#zoomSlider").on("input", (e) =>
            track.applyConstraints({ advanced: [{ zoom: e.target.value }] }),
          );
        }
        if (caps.exposureCompensation) {
          $("#expSlider").attr({
            min: caps.exposureCompensation.min,
            max: caps.exposureCompensation.max,
            step: caps.exposureCompensation.step,
          });
          $("#expSlider").on("input", (e) =>
            track.applyConstraints({
              advanced: [{ exposureCompensation: e.target.value }],
            }),
          );
        }
        if (caps.torch) {
          $("#torchBtn").click(() => {
            const curTorch = track.getSettings().torch;
            track.applyConstraints({ advanced: [{ torch: !curTorch }] });
          });
        }
      } catch (err) {
        alert("DSLR features require HTTPS and mobile hardware.");
      }
    });

  // Capture Photo
  document
    .getElementById("captureButton")
    .addEventListener("click", function () {
      const video = document.getElementById("cameraStream");
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext("2d").drawImage(video, 0, 0);

      const imageUrl = canvas.toDataURL("image/jpeg", 1.0);

      // Stop Camera
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }

      $("#cameraContainer").hide();
      openCropper(imageUrl);
    });

  function openCropper(src) {
    $("#cropperContainer").show();
    const image = document.getElementById("cropperImage");
    image.src = src;

    if (cropper) cropper.destroy();

    cropper = new Cropper(image, {
      aspectRatio: 450 / 500,
      viewMode: 1, // এটি ছবিকে কন্টেইনারের ভেতরে আটকে রাখবে
      autoCropArea: 1, // সর্বোচ্চ যতটুকু সম্ভব ছবি সিলেক্ট করবে
      dragMode: "none", // যাতে ইউজার ভুল করে ছবি সরিয়ে না ফেলে
      ready: function () {
        // ক্যামেরা থেকে আসা ছবি যদি লম্বা হয়, তবে এটি মাঝখান থেকে পারফেক্টলি সেট করবে
        this.cropper.setCropBoxData({
          width: this.cropper.getContainerData().width,
          height: this.cropper.getContainerData().height,
        });

        // ১.২ সেকেন্ড সময় দিচ্ছি যাতে ক্রপার ঠিকমতো ইমেজ ক্যালকুলেট করতে পারে
        setTimeout(function () {
          document.getElementById("cropDone").click();
        }, 1200);
      },
    });
  }

  // Crop Done Logic - এখানে ক্যানভাস তৈরি করার সময় কভার মোড ব্যবহার করা হয়েছে
  document.getElementById("cropDone").addEventListener("click", function () {
    if (!cropper) return;

    // আসল ছবির অনুপাত বের করা
    const imageData = cropper.getImageData();
    const originalRatio = imageData.naturalWidth / imageData.naturalHeight;

    // টার্গেট ratio (450/500 = 0.9)
    const targetRatio = 450 / 500;

    let cropWidth, cropHeight;

    if (originalRatio > targetRatio) {
      // ছবি চ্যাপ্টা → বাম-ডান কাটবে (উপর-নিচ কম)
      cropHeight = imageData.naturalHeight;
      cropWidth = cropHeight * targetRatio;
    } else {
      // ছবি লম্বা → উপরে-নিচ কাটবে
      cropWidth = imageData.naturalWidth;
      cropHeight = cropWidth / targetRatio;
    }

    const canvas = cropper.getCroppedCanvas({
      width: 450,
      height: 500,
      imageSmoothingEnabled: true,
      imageSmoothingQuality: "high",
    });

    const finalUrl = canvas.toDataURL("image/jpeg", 0.95);

    const finalImgElement = document.getElementById("finalImage");
    finalImgElement.src = finalUrl;

    // CSS দিয়ে নিশ্চিত করছি যাতে ডিসপ্লেতে কোনো অংশ না কাটে
    finalImgElement.style.width = "100%";
    finalImgElement.style.height = "400px"; // আপনার আগের ডিজাইন অনুযায়ী
    finalImgElement.style.objectFit = "fill";

    $("#imageContainer").show();
    $("#cropperContainer").hide();
    cropper.destroy();
    cropper = null;
  });

  // File Upload
  document
    .getElementById("uploadButton")
    .addEventListener("click", () =>
      document.getElementById("imageInput").click(),
    );
  document
    .getElementById("imageInput")
    .addEventListener("change", function (e) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        $("#imageContainer").hide();
        openCropper(ev.target.result);
      };
      reader.readAsDataURL(e.target.files[0]);
    });

  document.getElementById("cropCancel").addEventListener("click", () => {
    $("#cropperContainer").hide();
    $("#imageContainer").show();
  });

}

fetch("components/camera.html")
  .then((res) => {
    if (!res.ok) throw new Error(res.status);
    return res.text();
  })
  .then((html) => {
    document.getElementById("cameraMount").innerHTML = html;
    initCamera();
  })
  .catch(() => alert("Camera module could not be loaded. Open the site through a web server (https://mamunmia.test/pizmamun/)."));
// CAMERA END

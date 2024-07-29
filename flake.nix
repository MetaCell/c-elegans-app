{
  description = "Visualizer for various C Elegans brain map datasets, with multi-viewer support for easy comparison";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs?ref=nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs =
    {
      self,
      nixpkgs,
      flake-utils,
      ...
    }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = nixpkgs.legacyPackages.${system};

        pwd = builtins.getEnv "PWD";

        lib-path =
          with pkgs;
          lib.makeLibraryPath [
            libffi
            openssl
            stdenv.cc.cc
            zlib
            # If you want to use CUDA, you should uncomment this line.
            # linuxPackages.nvidia_x11
          ];

        buildDeps = with pkgs; [
          (python311.withPackages (
            ps: with ps; [
              # This list contains tools for Python development.
              # You can also add other tools like black.
              #
              # Note that even if you add Python packages here like PyTorch or Tensorflow,
              # they will be reinstalled when running 'pip -r requirements.txt' because
              # virtualenv is used bellow in the shellHook.
              ipython
              pip
              setuptools
              virtualenvwrapper
              wheel

              # missing Cloud Harness packages used in the tutorial
              openapi-spec-validator

              # CI testing
              tox
            ]
          ))

          # other packages needed for compiling python libs
          readline
          libffi
          openssl

          # unfortunately needed because of messing with LD_LIBRARY_PATH bellow
          git
          openssh
          rsync

          # cloud harness dependencies
          kubectl
          kubernetes-helm
          skaffold
          nodejs_22
          yarn
          openapi-generator-cli # .jar is used internally instead inside cloud harness
          jdk

          open-policy-agent

          minikube # not used (at least by me)

          # specific for the project
          tippecanoe
        ];

        devDeps = with pkgs; buildDeps ++ [ ];
      in
      {
        devShell = pkgs.mkShell {
          buildInputs = devDeps;

          # https://github.com/NixOS/nixpkgs/issues/314713
          UV_USE_IO_URING=0;

          shellHook = ''
            # Allow the use of wheels.
            SOURCE_DATE_EPOCH=$(date +%s)
            # Augment the dynamic linker path
            export "LD_LIBRARY_PATH=$LD_LIBRARY_PATH:${lib-path}"

            # Setup the virtual environment if it doesn't already exist.
            VENV=.venv
            if test ! -d $VENV; then
              virtualenv $VENV
            fi
            source ./$VENV/bin/activate
            export PYTHONPATH=${pwd}/$VENV/${pkgs.python312.sitePackages}/:$PYTHONPATH

            # Install Cloud Harness
            if ! command -v harness-application &> /dev/null
            then
              # Clone cloud harness if it is not present locally
              if [ !  -d cloud-harness ]; then
                git clone --single-branch --branch feature/CH-100 git@github.com:MetaCell/cloud-harness.git
              fi

              # Install CLI tools
              cd cloud-harness
              chmod +x ./install.sh
              ./install.sh

              # Install Cloud Harness common libraries
              cd libraries/cloudharness-common
              pip install .
              cd ../..

              cd ..
            fi

            # Generate local dev deployment
            harness-deployment cloud-harness . -n celegans -e prod -i visualizer --docker-compose

            # Install backend dependencies
            pip install -r applications/visualizer/backend/requirements.txt
            pip install -r applications/visualizer/backend/requirements-dev.txt

            # Install frontend dependencies
            yarn --cwd applications/visualizer/frontend install
          '';
        };
      }
    );
}
